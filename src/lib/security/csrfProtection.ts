import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { cookies } from 'next/headers';

interface CSRFConfig {
  secret: string;
  tokenName: string;
  cookieName: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  ignoredMethods: string[];
  ignoredPaths: string[];
}

export class CSRFProtectionService {
  private static readonly DEFAULT_CONFIG: CSRFConfig = {
    secret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
    tokenName: 'csrfToken',
    cookieName: '__Host-csrf-token',
    httpOnly: false, // Client needs to read this for forms
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    ignoredPaths: [
      '/api/auth/csrf',
      '/api/health',
      '/api/status',
    ],
  };

  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...CSRFProtectionService.DEFAULT_CONFIG, ...config };
  }

  generateToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const payload = `${timestamp}.${randomBytes}`;

    const hmac = crypto.createHmac('sha256', this.config.secret);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return `${payload}.${signature}`;
  }

  validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const [timestamp, randomBytes, signature] = parts;
    const payload = `${timestamp}.${randomBytes}`;

    // Verify signature
    const hmac = crypto.createHmac('sha256', this.config.secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return false;
    }

    // Check timestamp (token expiry)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const maxAge = this.config.maxAge * 1000; // Convert to milliseconds

    if (now - tokenTime > maxAge) {
      return false;
    }

    return true;
  }

  setCSRFCookie(res: NextApiResponse): string {
    const token = this.generateToken();

    const cookieOptions = {
      httpOnly: this.config.httpOnly,
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      maxAge: this.config.maxAge,
      path: '/',
    };

    // Set cookie
    res.setHeader(
      'Set-Cookie',
      this.serializeCookie(this.config.cookieName, token, cookieOptions)
    );

    return token;
  }

  getCSRFToken(req: NextApiRequest): string | null {
    // Try to get token from cookie
    const cookieToken = this.parseCookies(req.headers.cookie || '')[this.config.cookieName];
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  validateCSRFToken(req: NextApiRequest): {
    isValid: boolean;
    error?: string;
  } {
    // Skip validation for ignored methods
    if (this.config.ignoredMethods.includes(req.method || '')) {
      return { isValid: true };
    }

    // Skip validation for ignored paths
    const pathname = req.url?.split('?')[0] || '';
    if (this.config.ignoredPaths.some(path => pathname.startsWith(path))) {
      return { isValid: true };
    }

    // Get token from header or body
    const headerToken = req.headers['x-csrf-token'] as string ||
                       req.headers['csrf-token'] as string;
    const bodyToken = req.body?.[this.config.tokenName];

    const submittedToken = headerToken || bodyToken;

    if (!submittedToken) {
      return {
        isValid: false,
        error: 'CSRF token missing',
      };
    }

    // Get token from cookie
    const cookieToken = this.getCSRFToken(req);

    if (!cookieToken) {
      return {
        isValid: false,
        error: 'CSRF cookie missing',
      };
    }

    // Validate both tokens
    if (!this.validateToken(cookieToken) || !this.validateToken(submittedToken)) {
      return {
        isValid: false,
        error: 'Invalid CSRF token',
      };
    }

    // Compare tokens (they should be different but both valid)
    if (submittedToken === cookieToken) {
      return {
        isValid: false,
        error: 'CSRF token reuse detected',
      };
    }

    return { isValid: true };
  }

  middleware() {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const validation = this.validateCSRFToken(req);

      if (!validation.isValid) {
        console.warn(`CSRF validation failed: ${validation.error}`, {
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
          ip: this.getClientIP(req),
        });

        return res.status(403).json({
          success: false,
          error: 'CSRF validation failed',
          code: 'CSRF_TOKEN_INVALID',
        });
      }

      next();
    };
  }

  private serializeCookie(name: string, value: string, options: any): string {
    let cookie = `${name}=${encodeURIComponent(value)}`;

    if (options.maxAge) {
      cookie += `; Max-Age=${options.maxAge}`;
    }

    if (options.path) {
      cookie += `; Path=${options.path}`;
    }

    if (options.secure) {
      cookie += '; Secure';
    }

    if (options.httpOnly) {
      cookie += '; HttpOnly';
    }

    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }

    return cookie;
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    return cookies;
  }

  private getClientIP(req: NextApiRequest): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }
}

// Global CSRF service instance
export const csrfService = new CSRFProtectionService();

// CSRF middleware function
export function csrfProtection(req: NextApiRequest, res: NextApiResponse, next: () => void): void {
  return csrfService.middleware()(req, res, next);
}

// Double Submit Cookie Pattern Implementation
export class DoubleSubmitCSRFService {
  private static readonly SECRET = process.env.CSRF_SECRET || 'csrf-secret-key';

  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashToken(token: string): string {
    return crypto
      .createHmac('sha256', this.SECRET)
      .update(token)
      .digest('hex');
  }

  static setCSRFTokens(res: NextApiResponse): string {
    const token = this.generateCSRFToken();
    const hashedToken = this.hashToken(token);

    // Set cookie with hashed token
    res.setHeader(
      'Set-Cookie',
      `csrf-token=${hashedToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );

    // Return plain token for client
    return token;
  }

  static validateDoubleSubmitCSRF(req: NextApiRequest): boolean {
    const cookieToken = this.parseCookies(req.headers.cookie || '')['csrf-token'];
    const headerToken = req.headers['x-csrf-token'] as string;

    if (!cookieToken || !headerToken) {
      return false;
    }

    const expectedHashedToken = this.hashToken(headerToken);
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken, 'hex'),
      Buffer.from(expectedHashedToken, 'hex')
    );
  }

  private static parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      if (name && value) {
        cookies[name] = value;
      }
    });

    return cookies;
  }
}

// Origin validation for CSRF protection
export function validateOrigin(req: NextApiRequest): boolean {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  if (!origin && !referer) {
    return false;
  }

  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`, // Only for development
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.ALLOWED_ORIGINS?.split(',') || [],
  ].flat().filter(Boolean);

  if (origin) {
    return allowedOrigins.includes(origin);
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowedOrigins.includes(refererUrl.origin);
    } catch {
      return false;
    }
  }

  return false;
}

// Custom hook for CSRF token in React components
export function useCSRFToken(): {
  token: string | null;
  getToken: () => Promise<string>;
  validateToken: (token: string) => boolean;
} {
  const getToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  };

  const validateToken = (token: string): boolean => {
    return csrfService.validateToken(token);
  };

  return {
    token: null, // Would be managed by state in actual component
    getToken,
    validateToken,
  };
}

// CSRF token endpoint
export async function handleCSRFTokenRequest(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = csrfService.setCSRFCookie(res);

    return res.status(200).json({
      success: true,
      csrfToken: token,
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
    });
  }
}