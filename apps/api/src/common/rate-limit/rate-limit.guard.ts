import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

import { AuthenticatedUser } from '../auth/authenticated-user';
import { getAuthCookieNames } from '../auth/auth.constants';
import { Env } from '../config/env.validation';
import {
  RATE_LIMIT_KEY,
  RateLimitIdentity,
  RateLimitPolicy,
} from './rate-limit.decorator';
import { RateLimitExceededException } from './rate-limit.exception';
import { RateLimitService } from './rate-limit.service';

type RateLimitedRequest = Request & {
  cookies?: Record<string, string | undefined>;
  user?: AuthenticatedUser;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<RateLimitPolicy>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!policy) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RateLimitedRequest>();
    const response = http.getResponse<Response>();

    let lowestRemaining = Number.POSITIVE_INFINITY;
    let applicableLimit = 0;
    for (const bucket of policy.buckets) {
      const identityParts = await Promise.all(
        bucket.identities.map((identity) =>
          this.identityValue(identity, request),
        ),
      );
      const result = await this.rateLimitService.consume({
        identity: identityParts.join(':'),
        policyName: `${policy.name}:${bucket.name}`,
        limit: bucket.limit,
        windowSeconds: bucket.windowSeconds,
        cost: this.cost(bucket.cost, request),
      });
      applicableLimit = bucket.limit;
      lowestRemaining = Math.min(lowestRemaining, result.remaining);

      if (!result.allowed) {
        response.setHeader('X-RateLimit-Limit', bucket.limit);
        response.setHeader('X-RateLimit-Remaining', 0);
        this.logger.warn(
          JSON.stringify({
            event: 'rate_limit_blocked',
            policy: policy.name,
            bucket: bucket.name,
            retryAfterSeconds: result.retryAfterSeconds,
          }),
        );
        throw new RateLimitExceededException(result.retryAfterSeconds);
      }
    }

    response.setHeader('X-RateLimit-Limit', applicableLimit);
    response.setHeader(
      'X-RateLimit-Remaining',
      Number.isFinite(lowestRemaining) ? lowestRemaining : 0,
    );
    return true;
  }

  private async identityValue(
    identity: RateLimitIdentity,
    request: RateLimitedRequest,
  ): Promise<string> {
    if (identity === 'ip') {
      return `ip:${request.ip ?? request.socket.remoteAddress ?? 'unknown'}`;
    }
    if (identity === 'user') {
      return `user:${request.user?.id ?? 'anonymous'}`;
    }
    if (identity === 'refreshFamily') {
      const names = getAuthCookieNames(
        this.configService.get('NODE_ENV', { infer: true }),
      );
      const family = await this.rateLimitService.resolveRefreshFamily(
        request.cookies?.[names.refresh],
      );
      return `family:${family}`;
    }
    if ('static' in identity) {
      return `purpose:${identity.static}`;
    }
    if ('body' in identity) {
      const value = this.nestedValue(request.body, identity.body);
      return `body:${identity.body}:${this.normalize(value, identity.normalize)}`;
    }
    const value = request.params[identity.param];
    return `param:${identity.param}:${this.normalize(value, identity.normalize)}`;
  }

  private nestedValue(input: unknown, path: string): unknown {
    let current = input;
    for (const segment of path.split('.')) {
      if (!current || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  private normalize(
    value: unknown,
    mode: 'email' | 'lowercase' | undefined,
  ): string {
    if (typeof value !== 'string') return 'missing';
    const normalized = value.trim();
    if (mode === 'email' || mode === 'lowercase') {
      return normalized.toLowerCase();
    }
    return normalized || 'missing';
  }

  private cost(
    mode: 'request' | 'contentLengthMiB' | undefined,
    request: Request,
  ): number {
    if (mode !== 'contentLengthMiB') return 1;
    const contentLength = Number(request.headers['content-length'] ?? 0);
    if (!Number.isFinite(contentLength) || contentLength <= 0) return 1;
    return Math.max(1, Math.ceil(contentLength / 1024 / 1024));
  }
}
