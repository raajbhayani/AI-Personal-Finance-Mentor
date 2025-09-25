import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, isTokenExpired, JWTPayload } from './src/lib/utils/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout'
  ];

  const protectedPaths = [
    '/dashboard',
    '/transactions',
    '/goals',
    '/reports',
    '/profile',
    '/settings'
  ];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      if (isTokenExpired(token)) {
        const response = NextResponse.redirect(new URL('/login?expired=true', request.url));
        response.cookies.delete('auth-token');
        return response;
      }

      const payload: JWTPayload = verifyToken(token);

      if (!payload || !payload.userId) {
        throw new Error('Invalid token payload');
      }

      const response = NextResponse.next();
      response.headers.set('x-user-id', payload.userId);
      response.headers.set('x-user-role', payload.role || 'USER');

      return response;

    } catch (error) {
      console.error('Token verification failed:', error);

      const response = NextResponse.redirect(new URL('/login?error=invalid', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};