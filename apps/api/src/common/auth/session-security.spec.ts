import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../../users/users.service';
import {
  getAuthCookieNames,
  IS_PUBLIC_KEY,
  REQUIRE_CSRF_KEY,
} from './auth.constants';
import { CsrfGuard } from './csrf.guard';
import { CsrfService } from './csrf.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const configValues: Record<string, string> = {
  API_CORS_ORIGIN: 'https://vale.example',
  JWT_ACCESS_SECRET: 'test-access-secret-with-at-least-32-characters',
  JWT_AUDIENCE: 'vale-web',
  JWT_ISSUER: 'vale-api',
  NODE_ENV: 'test',
};
const configService = {
  get: jest.fn((key: string) => configValues[key]),
};

function contextFor(request: object): ExecutionContext {
  return {
    getClass: () => class Test {},
    getHandler: () => function handler() {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('session boundary security', () => {
  const csrfService = new CsrfService(configService as never);
  const privateReflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === REQUIRE_CSRF_KEY) return false;
      return undefined;
    }),
  } as unknown as Reflector;

  it('uses secure cookie prefixes in production', () => {
    expect(getAuthCookieNames('production')).toEqual({
      access: '__Host-vale_access_token',
      refresh: '__Secure-vale_refresh_token',
      csrf: '__Host-vale_csrf_token',
    });
  });

  it('accepts a signed double-submit token from the exact origin', () => {
    const token = csrfService.issueToken();
    const guard = new CsrfGuard(
      privateReflector,
      configService as never,
      csrfService,
    );

    expect(
      guard.canActivate(
        contextFor({
          cookies: {
            vale_access_token: 'access-token',
            vale_csrf_token: token,
          },
          headers: {
            origin: 'https://vale.example',
            'x-csrf-token': token,
          },
          method: 'PATCH',
        }),
      ),
    ).toBe(true);
  });

  it.each([
    {
      label: 'missing CSRF header',
      headers: { origin: 'https://vale.example' },
    },
    {
      label: 'untrusted origin',
      headers: {
        origin: 'https://attacker.example',
        'x-csrf-token': 'invalid',
      },
    },
  ])('rejects a cookie mutation with $label', ({ headers }) => {
    const guard = new CsrfGuard(
      privateReflector,
      configService as never,
      csrfService,
    );

    expect(() =>
      guard.canActivate(
        contextFor({
          cookies: {
            vale_access_token: 'access-token',
            vale_csrf_token: csrfService.issueToken(),
          },
          headers,
          method: 'POST',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('verifies JWT issuer, audience and algorithm and rejects expiration', async () => {
    const verifyAsync = jest
      .fn()
      .mockResolvedValueOnce({
        authVersion: 2,
        role: 'candidate',
        sid: 'session-id',
        status: 'active',
        sub: 'user-id',
      })
      .mockRejectedValueOnce(new Error('expired'));
    const usersService = {
      findActiveAuthUser: jest.fn().mockResolvedValue({
        authVersion: 2,
        id: 'user-id',
        role: 'candidate',
        status: 'active',
      }),
    };
    const guard = new JwtAuthGuard(
      privateReflector,
      { verifyAsync } as unknown as JwtService,
      usersService as unknown as UsersService,
      configService as never,
    );
    const context = contextFor({
      cookies: { vale_access_token: 'signed-token' },
      headers: {},
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('signed-token', {
      algorithms: ['HS256'],
      audience: 'vale-web',
      issuer: 'vale-api',
    });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
