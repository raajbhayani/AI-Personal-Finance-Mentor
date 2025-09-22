import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken, extractTokenFromHeader, AccessTokenPayload, createUserSession } from './tokens';
import { getAuthCookies, validateCookieSecurity, setAuthCookies, clearAuthCookies } from './cookies';
import { User } from '../../models/User';
import connectToDatabase from '../database/mongodb';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requiredRoles?: string[];
  allowTokenInHeader?: boolean;
  allowTokenInCookie?: boolean;
}

// Default options
const defaultOptions: AuthMiddlewareOptions = {
  requireAuth: true,
  requiredRoles: [],
  allowTokenInHeader: true,
  allowTokenInCookie: true,
};

/**
 * Authentication middleware factory
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void,
  options: AuthMiddlewareOptions = {}
) {
  const config = { ...defaultOptions, ...options };

  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Validate cookie security
      if (!validateCookieSecurity(req)) {
        return res.status(403).json({
          error: 'Insecure connection',
          message: 'HTTPS required in production',
        });
      }

      // Extract token from request
      let accessToken: string | undefined;

      // Try to get token from Authorization header
      if (config.allowTokenInHeader && req.headers.authorization) {
        try {
          accessToken = extractTokenFromHeader(req.headers.authorization);
        } catch (error) {
          if (config.requireAuth) {
            return res.status(401).json({
              error: 'Invalid authorization header',
              message: 'Bearer token format required',
            });
          }
        }
      }

      // Try to get token from cookies if not found in header
      if (!accessToken && config.allowTokenInCookie) {
        const { accessToken: cookieToken } = getAuthCookies(req);
        accessToken = cookieToken;
      }

      // Check if authentication is required
      if (config.requireAuth && !accessToken) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Access token is required',
        });
      }

      let user: AccessTokenPayload | null = null;

      // Verify token if present
      if (accessToken) {
        try {
          user = verifyAccessToken(accessToken);
        } catch (error) {
          if (config.requireAuth) {
            return res.status(401).json({
              error: 'Invalid token',
              message: error instanceof Error ? error.message : 'Token verification failed',
            });
          }
        }
      }

      // Check if user is required but not authenticated
      if (config.requireAuth && !user) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Valid access token required',
        });
      }

      // Check required roles
      if (user && config.requiredRoles && config.requiredRoles.length > 0) {
        if (!config.requiredRoles.includes(user.role)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: `Required roles: ${config.requiredRoles.join(', ')}`,
          });
        }
      }

      // Attach user to request if authenticated
      if (user) {
        (req as AuthenticatedRequest).user = {
          id: user.userId,
          email: user.email,
          role: user.role,
        };
      }

      // Call the actual handler
      return await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication middleware failed',
      });
    }
  };
}

/**
 * Middleware that requires authentication
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(handler, { requireAuth: true });
}

/**
 * Middleware that requires specific roles
 */
export function requireRoles(
  roles: string[],
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(handler, { requireAuth: true, requiredRoles: roles });
}

/**
 * Middleware that requires admin role
 */
export function requireAdmin(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return requireRoles(['ADMIN'], handler);
}

/**
 * Middleware that allows optional authentication
 */
export function optionalAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(handler, { requireAuth: false });
}

/**
 * Get user information from database and validate session
 */
export async function validateUserSession(userId: string): Promise<any | null> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return null;
    }

    // Check if user account is active/verified
    if (user.isDeleted || user.isSuspended) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('User session validation error:', error);
    return null;
  }
}

/**
 * Enhanced middleware that validates user session in database
 */
export function withSessionValidation(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void,
  options: AuthMiddlewareOptions = {}
) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user) {
      // Validate user session in database
      const dbUser = await validateUserSession(req.user.id);

      if (!dbUser) {
        return res.status(401).json({
          error: 'Invalid session',
          message: 'User session is no longer valid',
        });
      }

      // Enhance user object with database information
      req.user = {
        ...req.user,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
      };
    }

    return await handler(req, res);
  }, options);
}

/**
 * Middleware for API routes that require fresh database validation
 */
export function requireValidSession(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withSessionValidation(handler, { requireAuth: true });
}

/**
 * Rate limiting middleware (basic implementation)
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 15 * 60 * 1000 }
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = requests.get(key);

    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 1,
        resetTime: now + options.windowMs,
      };
    } else {
      clientData.count++;
    }

    requests.set(key, clientData);

    if (clientData.count > options.maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    return await handler(req, res);
  };
}

/**
 * CORS middleware for authentication endpoints
 */
export function withCORS(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: {
    origin?: string | string[];
    credentials?: boolean;
    methods?: string[];
  } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const {
      origin = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials = true,
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    } = options;

    // Set CORS headers
    if (Array.isArray(origin)) {
      const requestOrigin = req.headers.origin;
      if (requestOrigin && origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return await handler(req, res);
  };
}