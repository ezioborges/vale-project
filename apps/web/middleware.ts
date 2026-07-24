import type { UserRole, UserStatus } from '@vale/shared';
import { NextRequest, NextResponse } from 'next/server';

type SessionClaims = {
  role: UserRole;
  status: UserStatus;
};

export function initialPathForClaims(claims: SessionClaims): string {
  if (claims.status === 'suspended' || claims.status === 'disabled') {
    return '/conta-indisponivel';
  }

  if (claims.status === 'pending_email') {
    return claims.role === 'employer'
      ? '/onboarding/contratante'
      : '/onboarding/candidato';
  }

  const rolePaths: Record<UserRole, string> = {
    admin: '/admin',
    coordinator: '/app/equipe',
    employer: '/app/contratante',
    candidate: '/app/candidato',
  };

  return rolePaths[claims.role];
}

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('vale_access_token')?.value;
  const hasPublicVerificationToken =
    request.nextUrl.pathname.startsWith('/onboarding/') &&
    request.nextUrl.searchParams.has('token');

  if (!accessToken) {
    if (hasPublicVerificationToken) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/', request.url));
  }

  const claims = getClaims(accessToken);

  if (!claims) {
    if (hasPublicVerificationToken) {
      return NextResponse.next();
    }

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('vale_access_token');
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const initialPath = initialPathForClaims(claims);

  if (claims.status !== 'active') {
    if (pathname !== initialPath) {
      return NextResponse.redirect(new URL(initialPath, request.url));
    }

    return NextResponse.next();
  }

  if (pathname === '/app' || pathname.startsWith('/onboarding/')) {
    return NextResponse.redirect(new URL(initialPath, request.url));
  }

  const allowed =
    (pathname.startsWith('/admin') && claims.role === 'admin') ||
    (pathname.startsWith('/app/equipe') && claims.role === 'coordinator') ||
    (pathname.startsWith('/app/contratante') && claims.role === 'employer') ||
    (pathname.startsWith('/app/candidato') && claims.role === 'candidate');

  return allowed
    ? NextResponse.next()
    : NextResponse.redirect(new URL(initialPath, request.url));
}

function getClaims(accessToken: string): SessionClaims | null {
  const payload = accessToken.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const parsed = JSON.parse(atob(padded)) as Partial<SessionClaims>;

    if (
      !['admin', 'coordinator', 'employer', 'candidate'].includes(
        parsed.role ?? '',
      ) ||
      !['pending_email', 'active', 'suspended', 'disabled'].includes(
        parsed.status ?? '',
      )
    ) {
      return null;
    }

    return parsed as SessionClaims;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    '/app/:path*',
    '/admin/:path*',
    '/onboarding/candidato',
    '/onboarding/contratante',
  ],
};
