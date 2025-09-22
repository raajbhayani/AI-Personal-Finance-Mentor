import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextApiRequest) => string;
  onLimitReached?: (req: NextApiRequest, res: NextApiResponse) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  lastRequest: number;
  violations: number;
}

interface SecurityMetrics {
  suspiciousActivity: number;
  blockedRequests: number;
  failedAttempts: number;
  lastViolation: number;
}

export class AdvancedRateLimitService {
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private securityMetrics: Map<string, SecurityMetrics> = new Map();
  private blockedIPs: Set<string> = new Set();
  private suspiciousIPs: Map<string, number> = new Map();

  private readonly RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
    // Global rate limiting
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      keyGenerator: (req) => this.getClientIP(req),
    },

    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
      keyGenerator: (req) => this.getClientIP(req),
      onLimitReached: (req, res) => this.handleAuthViolation(req, res),
    },

    // Password reset
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyGenerator: (req) => this.getClientIP(req),
    },

    // API endpoints
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      keyGenerator: (req) => `${this.getClientIP(req)}:${this.getUserId(req)}`,
    },

    // File uploads
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
      keyGenerator: (req) => this.getClientIP(req),
    },

    // Analytics endpoints (more restrictive)
    analytics: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      keyGenerator: (req) => this.getUserId(req) || this.getClientIP(req),
    },

    // AI chat endpoints
    ai: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      keyGenerator: (req) => this.getUserId(req) || this.getClientIP(req),
    },
  };

  checkRateLimit(
    req: NextApiRequest,
    res: NextApiResponse,
    ruleName: string = 'global'
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const rule = this.RATE_LIMIT_RULES[ruleName];
    if (!rule) {
      throw new Error(`Unknown rate limit rule: ${ruleName}`);
    }

    const key = rule.keyGenerator ? rule.keyGenerator(req) : this.getClientIP(req);
    const clientIP = this.getClientIP(req);

    // Check if IP is blocked
    if (this.blockedIPs.has(clientIP)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + rule.windowMs,
        retryAfter: Math.ceil(rule.windowMs / 1000),
      };
    }

    // Check for suspicious patterns
    if (this.isSuspiciousRequest(req)) {
      this.recordSuspiciousActivity(clientIP);
    }

    const now = Date.now();
    const entry = this.rateLimitStore.get(key) || {
      count: 0,
      resetTime: now + rule.windowMs,
      firstRequest: now,
      lastRequest: now,
      violations: 0,
    };

    // Reset window if expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + rule.windowMs;
      entry.firstRequest = now;
    }

    entry.count++;
    entry.lastRequest = now;

    // Update rate limit store
    this.rateLimitStore.set(key, entry);

    // Check if limit exceeded
    if (entry.count > rule.maxRequests) {
      entry.violations++;

      // Trigger security response for repeated violations
      if (entry.violations >= 3) {
        this.handleRepeatedViolations(clientIP, ruleName);
      }

      // Call custom violation handler
      if (rule.onLimitReached) {
        rule.onLimitReached(req, res);
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: rule.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // DDoS detection and mitigation
  detectDDoS(req: NextApiRequest): {
    isDDoS: boolean;
    confidence: number;
    patterns: string[];
  } {
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const patterns: string[] = [];
    let confidence = 0;

    // Check request frequency
    const globalEntry = this.rateLimitStore.get(clientIP);
    if (globalEntry) {
      const requestRate = globalEntry.count / ((Date.now() - globalEntry.firstRequest) / 1000);
      if (requestRate > 10) { // More than 10 requests per second
        patterns.push('High request frequency');
        confidence += 30;
      }
    }

    // Check for bot patterns
    if (this.isBotUserAgent(userAgent)) {
      patterns.push('Bot user agent detected');
      confidence += 20;
    }

    // Check for missing or suspicious headers
    if (!req.headers.referer && !req.headers.origin) {
      patterns.push('Missing referrer headers');
      confidence += 15;
    }

    // Check for suspicious request patterns
    if (this.hasSuspiciousRequestPattern(req)) {
      patterns.push('Suspicious request pattern');
      confidence += 25;
    }

    // Check for geographic anomalies (if available)
    if (this.hasGeographicAnomaly(clientIP)) {
      patterns.push('Geographic anomaly');
      confidence += 10;
    }

    return {
      isDDoS: confidence >= 50,
      confidence,
      patterns,
    };
  }

  // Adaptive rate limiting based on server load
  getAdaptiveRateLimit(baseLimit: number): number {
    const serverLoad = this.getCurrentServerLoad();

    if (serverLoad > 0.8) {
      return Math.floor(baseLimit * 0.5); // Reduce by 50%
    } else if (serverLoad > 0.6) {
      return Math.floor(baseLimit * 0.7); // Reduce by 30%
    } else if (serverLoad > 0.4) {
      return Math.floor(baseLimit * 0.85); // Reduce by 15%
    }

    return baseLimit;
  }

  // IP blocking and unblocking
  blockIP(ip: string, duration: number = 60 * 60 * 1000): void {
    this.blockedIPs.add(ip);

    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);

    console.warn(`IP ${ip} blocked for ${duration}ms due to security violations`);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
  }

  // Geofencing (block requests from certain countries)
  isBlockedCountry(req: NextApiRequest): boolean {
    const country = req.headers['cf-ipcountry'] || req.headers['x-country-code'];
    const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || [];

    return country ? blockedCountries.includes(country.toString().toUpperCase()) : false;
  }

  // Rate limiting middleware factory
  createRateLimitMiddleware(ruleName: string = 'global') {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      // Skip rate limiting for certain conditions
      if (this.shouldSkipRateLimit(req)) {
        return next();
      }

      // Check for geofencing
      if (this.isBlockedCountry(req)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied from your location',
          code: 'GEO_BLOCKED',
        });
      }

      // DDoS detection
      const ddosCheck = this.detectDDoS(req);
      if (ddosCheck.isDDoS) {
        const clientIP = this.getClientIP(req);
        this.blockIP(clientIP, 30 * 60 * 1000); // Block for 30 minutes

        console.warn(`DDoS attack detected from ${clientIP}`, {
          confidence: ddosCheck.confidence,
          patterns: ddosCheck.patterns,
          userAgent: req.headers['user-agent'],
        });

        return res.status(429).json({
          success: false,
          error: 'Too many requests detected',
          code: 'DDOS_DETECTED',
        });
      }

      // Apply rate limiting
      const result = this.checkRateLimit(req, res, ruleName);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.RATE_LIMIT_RULES[ruleName].maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter!);

        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
        });
      }

      next();
    };
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now >= entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }

    // Clean up suspicious IPs older than 24 hours
    for (const [ip, timestamp] of this.suspiciousIPs.entries()) {
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }

  // Get statistics
  getStats(): {
    activeConnections: number;
    blockedIPs: number;
    suspiciousIPs: number;
    rateLimitViolations: number;
  } {
    const violations = Array.from(this.rateLimitStore.values())
      .reduce((sum, entry) => sum + entry.violations, 0);

    return {
      activeConnections: this.rateLimitStore.size,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      rateLimitViolations: violations,
    };
  }

  private getClientIP(req: NextApiRequest): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIP = req.headers['x-real-ip'] as string;
    const cfConnectingIP = req.headers['cf-connecting-ip'] as string;

    return (
      cfConnectingIP ||
      realIP ||
      (forwarded ? forwarded.split(',')[0].trim() : '') ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  private getUserId(req: NextApiRequest): string | null {
    // Extract user ID from JWT token if available
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      // This would use your JWT verification logic
      const decoded = this.verifyJWT(token);
      return decoded?.userId || null;
    } catch {
      return null;
    }
  }

  private verifyJWT(token: string): any {
    // Placeholder for JWT verification
    // This should use your actual JWT verification logic
    return null;
  }

  private isSuspiciousRequest(req: NextApiRequest): boolean {
    const userAgent = req.headers['user-agent'] || '';
    const path = req.url || '';

    // Check for common attack patterns
    const suspiciousPatterns = [
      /\.\.\//,  // Path traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /\$ne|\$gt|\$lt/i,  // NoSQL injection
      /eval\(|javascript:/i,  // Code injection
    ];

    return suspiciousPatterns.some(pattern =>
      pattern.test(path) || pattern.test(userAgent)
    );
  }

  private isBotUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private hasSuspiciousRequestPattern(req: NextApiRequest): boolean {
    // Check for rapid sequential requests to different endpoints
    const clientIP = this.getClientIP(req);
    const entry = this.rateLimitStore.get(clientIP);

    if (entry && entry.count > 50) {
      const avgInterval = (entry.lastRequest - entry.firstRequest) / entry.count;
      return avgInterval < 100; // Less than 100ms between requests
    }

    return false;
  }

  private hasGeographicAnomaly(ip: string): boolean {
    // Placeholder for geographic analysis
    // This would integrate with a geolocation service
    return false;
  }

  private getCurrentServerLoad(): number {
    // Placeholder for server load monitoring
    // This would integrate with system monitoring
    return 0.5; // Return mock 50% load
  }

  private shouldSkipRateLimit(req: NextApiRequest): boolean {
    // Skip for health checks and monitoring
    const skipPaths = ['/api/health', '/api/status', '/api/ping'];
    const path = req.url?.split('?')[0] || '';

    return skipPaths.includes(path);
  }

  private recordSuspiciousActivity(ip: string): void {
    this.suspiciousIPs.set(ip, Date.now());

    const metrics = this.securityMetrics.get(ip) || {
      suspiciousActivity: 0,
      blockedRequests: 0,
      failedAttempts: 0,
      lastViolation: 0,
    };

    metrics.suspiciousActivity++;
    metrics.lastViolation = Date.now();
    this.securityMetrics.set(ip, metrics);
  }

  private handleAuthViolation(req: NextApiRequest, res: NextApiResponse): void {
    const clientIP = this.getClientIP(req);
    this.recordSuspiciousActivity(clientIP);

    // Block IP after 5 authentication violations in 15 minutes
    const entry = this.rateLimitStore.get(clientIP);
    if (entry && entry.violations >= 5) {
      this.blockIP(clientIP, 60 * 60 * 1000); // Block for 1 hour
    }
  }

  private handleRepeatedViolations(ip: string, ruleName: string): void {
    // Escalate security response
    const blockDuration = this.getBlockDuration(ip, ruleName);
    this.blockIP(ip, blockDuration);

    console.error(`Repeated rate limit violations from ${ip} for rule ${ruleName}`);
  }

  private getBlockDuration(ip: string, ruleName: string): number {
    const metrics = this.securityMetrics.get(ip);
    const baseBlockTime = 15 * 60 * 1000; // 15 minutes

    if (!metrics) {
      return baseBlockTime;
    }

    // Exponential backoff based on violation history
    const violationCount = metrics.suspiciousActivity + metrics.blockedRequests;
    return Math.min(baseBlockTime * Math.pow(2, violationCount), 24 * 60 * 60 * 1000);
  }
}

// Global rate limiter instance
export const advancedRateLimiter = new AdvancedRateLimitService();

// Start cleanup interval
setInterval(() => {
  advancedRateLimiter.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes

// Convenience middleware exports
export const globalRateLimit = advancedRateLimiter.createRateLimitMiddleware('global');
export const authRateLimit = advancedRateLimiter.createRateLimitMiddleware('auth');
export const apiRateLimit = advancedRateLimiter.createRateLimitMiddleware('api');
export const uploadRateLimit = advancedRateLimiter.createRateLimitMiddleware('upload');
export const analyticsRateLimit = advancedRateLimiter.createRateLimitMiddleware('analytics');
export const aiRateLimit = advancedRateLimiter.createRateLimitMiddleware('ai');