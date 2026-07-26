import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { Env } from '../config/env.validation';
import {
  getAuthCookieNames,
  IS_PUBLIC_KEY,
  REQUIRE_CSRF_KEY,
} from './auth.constants';
import { CsrfService } from './csrf.service';

type CookieRequest = Request & {
  cookies?: Record<string, string | undefined>;
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService<Env, true>,
    private readonly csrfService: CsrfService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CookieRequest>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const explicitlyProtected =
      this.reflector.getAllAndOverride<boolean>(REQUIRE_CSRF_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic && !explicitlyProtected) {
      return true;
    }

    const authorization = request.headers.authorization;
    if (authorization?.toLowerCase().startsWith('bearer ')) {
      return true;
    }

    const names = getAuthCookieNames(
      this.configService.get('NODE_ENV', { infer: true }),
    );
    const hasSessionCookie =
      Boolean(request.cookies?.[names.access]) ||
      Boolean(request.cookies?.[names.refresh]);

    if (!hasSessionCookie) {
      return true;
    }

    this.assertTrustedOrigin(request);

    const cookieToken = request.cookies?.[names.csrf];
    const header = request.headers['x-csrf-token'];
    const headerToken = Array.isArray(header) ? header[0] : header;

    if (
      !cookieToken ||
      !headerToken ||
      !this.csrfService.tokensMatch(cookieToken, headerToken)
    ) {
      throw new ForbiddenException('CSRF validation failed.');
    }

    return true;
  }

  private assertTrustedOrigin(request: Request): void {
    const expectedOrigin = new URL(
      this.configService.get('API_CORS_ORIGIN', { infer: true }),
    ).origin;
    const suppliedOrigin = request.headers.origin;
    const referer = request.headers.referer;

    let actualOrigin: string | undefined;
    try {
      actualOrigin = suppliedOrigin
        ? new URL(suppliedOrigin).origin
        : referer
          ? new URL(referer).origin
          : undefined;
    } catch {
      throw new ForbiddenException('Request origin is invalid.');
    }

    if (actualOrigin !== expectedOrigin) {
      throw new ForbiddenException('Request origin is not allowed.');
    }
  }
}
