import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { MongoSecurityService } from './mongoSecurity';

export interface SecurityContext {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  mfaVerified: boolean;
  deviceFingerprint?: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  maxSessions: number;
  requireMFA: boolean;
  sessionTimeout: number;
}

export class EnhancedAuthService {
  private readonly config: AuthConfig;
  private readonly activeSessions: Map<string, SecurityContext> = new Map();
  private readonly failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly deviceRegistry: Map<string, { trusted: boolean; lastSeen: Date }> = new Map();

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'default-secret',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      maxSessions: parseInt(process.env.MAX_SESSIONS || '5'),
      requireMFA: process.env.REQUIRE_MFA === 'true',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
      ...config,
    };
  }

  // Enhanced password hashing with salt
  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  // Secure password verification with timing attack protection
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);

      // Add artificial delay to prevent timing attacks
      const delay = crypto.randomInt(10, 50);
      await new Promise(resolve => setTimeout(resolve, delay));

      return isValid;
    } catch {
      // Add same delay for errors to prevent timing analysis
      const delay = crypto.randomInt(10, 50);
      await new Promise(resolve => setTimeout(resolve, delay));
      return false;
    }
  }

  // Generate secure tokens with additional claims
  generateTokens(user: any, sessionId: string, deviceFingerprint?: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessTokenPayload = {
      userId: user._id || user.id,
      email: user.email,
      role: user.role || 'USER',
      permissions: user.permissions || [],
      sessionId,
      deviceFingerprint,
      type: 'access',
    };

    const refreshTokenPayload = {
      userId: user._id || user.id,
      sessionId,
      tokenVersion: user.tokenVersion || 0,
      type: 'refresh',
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      this.config.jwtSecret,
      { expiresIn: this.config.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      this.config.jwtRefreshSecret,
      { expiresIn: this.config.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  // Verify and decode tokens with enhanced security checks
  verifyAccessToken(token: string): SecurityContext | null {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;

      if (decoded.type !== 'access') {
        return null;
      }

      // Check if session is still active
      const session = this.activeSessions.get(decoded.sessionId);
      if (!session) {
        return null;
      }

      // Check session timeout
      if (Date.now() - session.lastActivity.getTime() > this.config.sessionTimeout) {
        this.invalidateSession(decoded.sessionId);
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();
      this.activeSessions.set(decoded.sessionId, session);

      return session;
    } catch {
      return null;
    }
  }

  // Multi-factor authentication
  generateMFASecret(): { secret: string; qrCode: string } {
    const secret = crypto.randomBytes(32).toString('base64');
    // In a real implementation, you'd generate a QR code for TOTP
    const qrCode = `data:image/svg+xml;base64,${Buffer.from(`<svg>QR Code for ${secret}</svg>`).toString('base64')}`;

    return { secret, qrCode };
  }

  verifyMFAToken(secret: string, token: string): boolean {
    // Placeholder for TOTP verification
    // In real implementation, use a library like speakeasy
    const expectedToken = this.generateTOTP(secret);
    return token === expectedToken;
  }

  // Device fingerprinting
  generateDeviceFingerprint(req: NextApiRequest): string {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const ip = this.getClientIP(req);

    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}${acceptLanguage}${acceptEncoding}${ip}`)
      .digest('hex');

    return fingerprint;
  }

  // Session management
  createSession(
    user: any,
    req: NextApiRequest,
    mfaVerified: boolean = false
  ): { sessionId: string; tokens: { accessToken: string; refreshToken: string } } {
    const sessionId = crypto.randomUUID();
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // Check session limit
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.userId === user._id || user.id);

    if (userSessions.length >= this.config.maxSessions) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) =>
        a.lastActivity.getTime() - b.lastActivity.getTime()
      )[0];
      this.invalidateSession(oldestSession.sessionId);
    }

    const securityContext: SecurityContext = {
      userId: user._id || user.id,
      email: user.email,
      role: user.role || 'USER',
      permissions: user.permissions || [],
      sessionId,
      ipAddress,
      userAgent,
      lastActivity: new Date(),
      mfaVerified,
      deviceFingerprint,
    };

    this.activeSessions.set(sessionId, securityContext);

    // Register device if not known
    if (!this.deviceRegistry.has(deviceFingerprint)) {
      this.deviceRegistry.set(deviceFingerprint, {
        trusted: false,
        lastSeen: new Date(),
      });
    } else {
      const device = this.deviceRegistry.get(deviceFingerprint)!;
      device.lastSeen = new Date();
      this.deviceRegistry.set(deviceFingerprint, device);
    }

    const tokens = this.generateTokens(user, sessionId, deviceFingerprint);

    return { sessionId, tokens };
  }

  invalidateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  invalidateAllUserSessions(userId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  // Brute force protection
  recordFailedAttempt(identifier: string): boolean {
    const attempt = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };

    const now = new Date();
    const timeDiff = now.getTime() - attempt.lastAttempt.getTime();

    // Reset counter if last attempt was more than 15 minutes ago
    if (timeDiff > 15 * 60 * 1000) {
      attempt.count = 1;
    } else {
      attempt.count++;
    }

    attempt.lastAttempt = now;
    this.failedAttempts.set(identifier, attempt);

    // Block after 5 failed attempts
    return attempt.count >= 5;
  }

  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  // Role-based access control
  hasPermission(context: SecurityContext, requiredPermission: string): boolean {
    return context.permissions.includes(requiredPermission) ||
           context.permissions.includes('*') ||
           context.role === 'ADMIN';
  }

  hasRole(context: SecurityContext, requiredRole: string): boolean {
    const roleHierarchy = {
      'SUPER_ADMIN': ['ADMIN', 'USER'],
      'ADMIN': ['USER'],
      'USER': [],
    };

    const userRoles = [context.role, ...(roleHierarchy[context.role as keyof typeof roleHierarchy] || [])];
    return userRoles.includes(requiredRole);
  }

  // Enhanced authentication middleware
  createAuthMiddleware(options: {
    requiredRole?: string;
    requiredPermission?: string;
    requireMFA?: boolean;
    allowRefreshToken?: boolean;
  } = {}) {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'MISSING_TOKEN',
          });
        }

        // Verify token and get security context
        const context = this.verifyAccessToken(token);
        if (!context) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
          });
        }

        // Check device fingerprint
        const currentFingerprint = this.generateDeviceFingerprint(req);
        if (context.deviceFingerprint && context.deviceFingerprint !== currentFingerprint) {
          this.invalidateSession(context.sessionId);
          return res.status(401).json({
            success: false,
            error: 'Device verification failed',
            code: 'DEVICE_MISMATCH',
          });
        }

        // Check IP address consistency (optional warning)
        const currentIP = this.getClientIP(req);
        if (context.ipAddress !== currentIP) {
          console.warn(`IP address changed for session ${context.sessionId}: ${context.ipAddress} -> ${currentIP}`);
          // Update IP address but don't block (user might be on mobile)
          context.ipAddress = currentIP;
        }

        // Check MFA requirement
        if ((options.requireMFA || this.config.requireMFA) && !context.mfaVerified) {
          return res.status(403).json({
            success: false,
            error: 'Multi-factor authentication required',
            code: 'MFA_REQUIRED',
          });
        }

        // Check role requirements
        if (options.requiredRole && !this.hasRole(context, options.requiredRole)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient role privileges',
            code: 'INSUFFICIENT_ROLE',
          });
        }

        // Check permission requirements
        if (options.requiredPermission && !this.hasPermission(context, options.requiredPermission)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSION',
          });
        }

        // Add security context to request
        (req as any).securityContext = context;
        (req as any).user = {
          userId: context.userId,
          email: context.email,
          role: context.role,
        };

        // Add security headers
        res.setHeader('X-Session-ID', context.sessionId);
        res.setHeader('X-User-Role', context.role);

        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
          success: false,
          error: 'Authentication system error',
          code: 'AUTH_SYSTEM_ERROR',
        });
      }
    };
  }

  // Resource ownership validation
  async validateResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    operation: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Use MongoDB security service to ensure user context
      const filter = MongoSecurityService.createSecureFilter(userId, { _id: resourceId });

      // This would query the appropriate model based on resourceType
      // For now, return true as placeholder
      return true;
    } catch {
      return false;
    }
  }

  // Security monitoring
  getSecurityMetrics(): {
    activeSessions: number;
    failedAttempts: number;
    trustedDevices: number;
    suspiciousActivity: number;
  } {
    const suspiciousActivity = Array.from(this.failedAttempts.values())
      .filter(attempt => attempt.count >= 3).length;

    const trustedDevices = Array.from(this.deviceRegistry.values())
      .filter(device => device.trusted).length;

    return {
      activeSessions: this.activeSessions.size,
      failedAttempts: this.failedAttempts.size,
      trustedDevices,
      suspiciousActivity,
    };
  }

  // Cleanup expired sessions and failed attempts
  cleanup(): void {
    const now = Date.now();

    // Clean expired sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > this.config.sessionTimeout) {
        this.activeSessions.delete(sessionId);
      }
    }

    // Clean old failed attempts (older than 24 hours)
    for (const [identifier, attempt] of this.failedAttempts.entries()) {
      if (now - attempt.lastAttempt.getTime() > 24 * 60 * 60 * 1000) {
        this.failedAttempts.delete(identifier);
      }
    }

    // Clean old device registry entries (older than 90 days)
    for (const [fingerprint, device] of this.deviceRegistry.entries()) {
      if (now - device.lastSeen.getTime() > 90 * 24 * 60 * 60 * 1000) {
        this.deviceRegistry.delete(fingerprint);
      }
    }
  }

  private getClientIP(req: NextApiRequest): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }

  private generateTOTP(secret: string): string {
    // Placeholder TOTP generation
    // In real implementation, use a proper TOTP library
    const timeStep = Math.floor(Date.now() / 30000);
    return crypto
      .createHmac('sha256', secret)
      .update(timeStep.toString())
      .digest('hex')
      .substring(0, 6);
  }
}

// Global enhanced auth service
export const enhancedAuthService = new EnhancedAuthService();

// Start cleanup interval
setInterval(() => {
  enhancedAuthService.cleanup();
}, 10 * 60 * 1000); // Cleanup every 10 minutes

// Convenience middleware exports
export const requireAuth = enhancedAuthService.createAuthMiddleware();
export const requireAdmin = enhancedAuthService.createAuthMiddleware({ requiredRole: 'ADMIN' });
export const requireMFA = enhancedAuthService.createAuthMiddleware({ requireMFA: true });

// Permission-based middleware factory
export function requirePermission(permission: string) {
  return enhancedAuthService.createAuthMiddleware({ requiredPermission: permission });
}

// Role-based middleware factory
export function requireRole(role: string) {
  return enhancedAuthService.createAuthMiddleware({ requiredRole: role });
}