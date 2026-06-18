import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/app', '/admin'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('vale_access_token')?.value;

  if (!accessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/admin') && getRole(accessToken) !== 'admin') {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
}

function getRole(accessToken: string): string | null {
  const payload = accessToken.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(atob(payload)).role ?? null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
