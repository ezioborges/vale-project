import { NextResponse } from 'next/server';

export function middleware() {
  // The scoped refresh cookie is intentionally unavailable on page routes.
  // Protected layouts ask the API for the current user through the central
  // transport, which can refresh at /auth/refresh before rendering.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/app/:path*',
    '/admin/:path*',
    '/onboarding/candidato',
    '/onboarding/contratante',
  ],
};
