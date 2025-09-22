import { IncomingMessage } from 'http';
import { NextApiRequest } from 'next';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/auth';
import { User } from '../../models/User';
import connectToDatabase from '../database/mongodb';

export interface Context {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
  req: IncomingMessage | NextApiRequest;
}

export interface GraphQLContext {
  req: IncomingMessage | NextApiRequest;
}

export async function createContext({ req }: GraphQLContext): Promise<Context> {
  // Ensure database connection
  await connectToDatabase();

  const context: Context = { req };

  try {
    // Extract authorization header
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // Extract token from Bearer header
      const token = extractTokenFromHeader(authHeader);

      // Verify token
      const payload: JWTPayload = verifyToken(token);

      if (payload.userId) {
        // Optionally fetch full user data from database for additional context
        const user = await User.findById(payload.userId).select('email role');

        if (user) {
          context.user = {
            id: payload.userId,
            role: payload.role || 'USER',
            email: user.email,
          };
        } else {
          // User not found in database but token is valid
          context.user = {
            id: payload.userId,
            role: payload.role || 'USER',
          };
        }
      }
    }
  } catch (error) {
    // Authentication failed - continue without user context
    // This allows public queries to work while protecting authenticated ones
    console.warn('Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  return context;
}

// Helper function to get user from context with better type safety
export function requireAuth(context: Context): NonNullable<Context['user']> {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
}

// Helper function to check if user has required role
export function requireRole(context: Context, requiredRole: string): NonNullable<Context['user']> {
  const user = requireAuth(context);

  const roleHierarchy = {
    'USER': 0,
    'PREMIUM': 1,
    'ADMIN': 2,
  };

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 0;

  if (userLevel < requiredLevel) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
  }

  return user;
}

// Helper function to check if user owns a resource
export function requireOwnership(context: Context, resourceUserId: string): NonNullable<Context['user']> {
  const user = requireAuth(context);

  // Admin can access any resource
  if (user.role === 'ADMIN') {
    return user;
  }

  // User can only access their own resources
  if (user.id !== resourceUserId) {
    throw new Error('Access denied. You can only access your own resources.');
  }

  return user;
}