import type { Env } from '../config/env.validation';

export const ACCESS_TOKEN_COOKIE = 'vale_access_token';
export const REFRESH_TOKEN_COOKIE = 'vale_refresh_token';
export const CSRF_TOKEN_COOKIE = 'vale_csrf_token';

export function getAuthCookieNames(environment: Env['NODE_ENV']): {
  access: string;
  refresh: string;
  csrf: string;
} {
  return environment === 'production'
    ? {
        access: '__Host-vale_access_token',
        refresh: '__Secure-vale_refresh_token',
        csrf: '__Host-vale_csrf_token',
      }
    : {
        access: ACCESS_TOKEN_COOKIE,
        refresh: REFRESH_TOKEN_COOKIE,
        csrf: CSRF_TOKEN_COOKIE,
      };
}

export const IS_PUBLIC_KEY = 'isPublic';
export const REQUIRE_CSRF_KEY = 'requireCsrf';
export const ROLES_KEY = 'roles';
export const REQUIRE_TERMS_KEY = 'requireAcceptedTerms';
export const REQUIRE_EMAIL_VERIFIED_KEY = 'requireEmailVerified';
