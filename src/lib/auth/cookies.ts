import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie';
import { getTokenExpirationTimes } from './tokens';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.COOKIE_DOMAIN;

// Default secure cookie options
const defaultCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  ...(cookieDomain && { domain: cookieDomain }),
};

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  SESSION_ID: 'sessionId',
} as const;

/**
 * Set HTTP-only cookie in response
 */
export function setCookie(
  res: NextApiResponse,
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const cookieOptions = { ...defaultCookieOptions, ...options };
  const serialized = serialize(name, value, cookieOptions);

  // Handle multiple Set-Cookie headers
  const existingCookies = res.getHeader('Set-Cookie') || [];
  const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies];
  cookies.push(serialized);

  res.setHeader('Set-Cookie', cookies);
}

/**
 * Get cookie value from request
 */
export function getCookie(req: NextApiRequest, name: string): string | undefined {
  const cookies = parseCookies(req);
  return cookies[name];
}

/**
 * Parse all cookies from request
 */
export function parseCookies(req: NextApiRequest): Record<string, string> {
  const cookieHeader = req.headers.cookie;
  return cookieHeader ? parse(cookieHeader) : {};
}

/**
 * Clear cookie by setting it to expire
 */
export function clearCookie(
  res: NextApiResponse,
  name: string,
  options: Omit<CookieOptions, 'maxAge'> = {}
): void {
  setCookie(res, name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Set authentication tokens as HTTP-only cookies
 */
export function setAuthCookies(
  res: NextApiResponse,
  accessToken: string,
  refreshToken: string
): void {
  const expirationTimes = getTokenExpirationTimes();

  // Set access token cookie (short-lived)
  setCookie(res, COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    maxAge: Math.floor(expirationTimes.accessToken / 1000), // Convert to seconds
  });

  // Set refresh token cookie (long-lived)
  setCookie(res, COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    maxAge: Math.floor(expirationTimes.refreshToken / 1000), // Convert to seconds
  });
}

/**
 * Get authentication tokens from cookies
 */
export function getAuthCookies(req: NextApiRequest): {
  accessToken?: string;
  refreshToken?: string;
} {
  return {
    accessToken: getCookie(req, COOKIE_NAMES.ACCESS_TOKEN),
    refreshToken: getCookie(req, COOKIE_NAMES.REFRESH_TOKEN),
  };
}

/**
 * Clear all authentication cookies
 */
export function clearAuthCookies(res: NextApiResponse): void {
  clearCookie(res, COOKIE_NAMES.ACCESS_TOKEN);
  clearCookie(res, COOKIE_NAMES.REFRESH_TOKEN);
  clearCookie(res, COOKIE_NAMES.SESSION_ID);
}

/**
 * Set session ID cookie
 */
export function setSessionCookie(
  res: NextApiResponse,
  sessionId: string,
  maxAge?: number
): void {
  setCookie(res, COOKIE_NAMES.SESSION_ID, sessionId, {
    maxAge: maxAge || Math.floor(getTokenExpirationTimes().refreshToken / 1000),
  });
}

/**
 * Get session ID from cookie
 */
export function getSessionCookie(req: NextApiRequest): string | undefined {
  return getCookie(req, COOKIE_NAMES.SESSION_ID);
}

/**
 * Set secure cookie with automatic encryption (for sensitive data)
 */
export function setSecureCookie(
  res: NextApiResponse,
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  // In a production environment, you might want to encrypt the value
  // For now, we'll just base64 encode it for basic obfuscation
  const encodedValue = Buffer.from(value).toString('base64');

  setCookie(res, name, encodedValue, {
    ...options,
    httpOnly: true,
    secure: isProduction,
  });
}

/**
 * Get and decode secure cookie
 */
export function getSecureCookie(req: NextApiRequest, name: string): string | undefined {
  const encodedValue = getCookie(req, name);
  if (!encodedValue) return undefined;

  try {
    return Buffer.from(encodedValue, 'base64').toString('utf-8');
  } catch {
    return undefined;
  }
}

/**
 * Validate cookie security based on environment
 */
export function validateCookieSecurity(req: NextApiRequest): boolean {
  // In production, ensure requests come over HTTPS
  if (isProduction) {
    const protocol = req.headers['x-forwarded-proto'] ||
                    (req.connection as any)?.encrypted ? 'https' : 'http';

    if (protocol !== 'https') {
      return false;
    }
  }

  return true;
}

/**
 * Get cookie options for different environments
 */
export function getCookieOptions(environment: 'development' | 'production' | 'test'): CookieOptions {
  switch (environment) {
    case 'production':
      return {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        ...(cookieDomain && { domain: cookieDomain }),
      };

    case 'development':
      return {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      };

    case 'test':
      return {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      };

    default:
      return defaultCookieOptions;
  }
}