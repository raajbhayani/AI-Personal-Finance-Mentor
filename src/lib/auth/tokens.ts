import jwt from 'jsonwebtoken';
import { User } from '../../models/User';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserSession {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  tokenVersion: number;
}

// Generate access token (short-lived)
export function generateAccessToken(user: UserSession): string {
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

// Generate refresh token (long-lived)
export function generateRefreshToken(user: UserSession): string {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    tokenVersion: user.tokenVersion,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

// Generate both tokens
export function generateTokenPair(user: UserSession): TokenPair {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

// Verify access token
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    throw new Error('Access token verification failed');
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET!) as RefreshTokenPayload;

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    throw new Error('Refresh token verification failed');
  }
}

// Decode token without verification
export function decodeToken(token: string): AccessTokenPayload | RefreshTokenPayload | null {
  try {
    return jwt.decode(token) as AccessTokenPayload | RefreshTokenPayload;
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  return Date.now() >= decoded.exp * 1000;
}

// Extract token from Authorization header
export function extractTokenFromHeader(authHeader: string): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header format');
  }
  return authHeader.substring(7);
}

// Get token expiration times in milliseconds
export function getTokenExpirationTimes() {
  return {
    accessToken: parseExpirationTime(ACCESS_TOKEN_EXPIRES_IN),
    refreshToken: parseExpirationTime(REFRESH_TOKEN_EXPIRES_IN),
  };
}

// Helper function to parse expiration time strings
function parseExpirationTime(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}

// Create user session from database user
export function createUserSession(user: any): UserSession {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role || 'USER',
    firstName: user.firstName,
    lastName: user.lastName,
    tokenVersion: user.tokenVersion || 0,
  };
}

// Legacy function for backward compatibility
export function generateToken(userId: string, role: string = 'USER'): string {
  const userSession: UserSession = {
    id: userId,
    email: '',
    role,
    tokenVersion: 0,
  };
  return generateAccessToken(userSession);
}

// Legacy function for backward compatibility
export function verifyToken(token: string): AccessTokenPayload {
  return verifyAccessToken(token);
}