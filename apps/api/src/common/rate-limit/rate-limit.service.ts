import { createHash } from 'node:crypto';

import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { RefreshToken } from '../../auth/refresh-token.entity';
import { Env } from '../config/env.validation';
import { RateLimitCounter } from './rate-limit-counter.entity';
import { RateLimitExceededException } from './rate-limit.exception';

@Injectable()
export class RateLimitService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RateLimitService.name);
  private cleanupTimer?: NodeJS.Timeout;
  private cleanupInProgress = false;

  constructor(
    @InjectRepository(RateLimitCounter)
    private readonly repository: Repository<RateLimitCounter>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.runMaintenance();
    const intervalMilliseconds =
      this.configService.get('RATE_LIMIT_CLEANUP_INTERVAL_SECONDS', {
        infer: true,
      }) * 1000;
    this.cleanupTimer = setInterval(() => {
      void this.runMaintenance();
    }, intervalMilliseconds);
    this.cleanupTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async consume(input: {
    identity: string;
    policyName: string;
    limit: number;
    windowSeconds: number;
    cost?: number;
  }): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  }> {
    const now = Date.now();
    const windowMilliseconds = input.windowSeconds * 1000;
    const bucketStart =
      Math.floor(now / windowMilliseconds) * windowMilliseconds;
    const expiresAt = new Date(bucketStart + windowMilliseconds);
    const key = createHash('sha256')
      .update(`${input.policyName}:${input.identity}:${bucketStart}`)
      .digest('hex');
    const cost = Math.max(1, Math.floor(input.cost ?? 1));

    const rows = (await this.repository.query(
      `
        INSERT INTO "rate_limit_counters" ("key", "hits", "expires_at")
        VALUES ($1, $2, $3)
        ON CONFLICT ("key") DO UPDATE
        SET "hits" = "rate_limit_counters"."hits" + EXCLUDED."hits"
        RETURNING "hits"
      `,
      [key, cost, expiresAt],
    )) as Array<{ hits: number | string }>;
    const hits = Number(rows[0]?.hits ?? cost);

    return {
      allowed: hits <= input.limit,
      remaining: Math.max(0, input.limit - hits),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((expiresAt.getTime() - now) / 1000),
      ),
    };
  }

  async resolveRefreshFamily(rawToken: string | undefined): Promise<string> {
    if (!rawToken) return 'missing';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const token = await this.refreshTokenRepository.findOne({
      select: { familyId: true },
      where: { tokenHash },
    });
    return token?.familyId ?? `unknown:${tokenHash}`;
  }

  async cleanupExpired(now = new Date()): Promise<number> {
    if (this.cleanupInProgress) return 0;
    this.cleanupInProgress = true;
    try {
      const result = await this.repository.delete({
        expiresAt: LessThan(now),
      });
      return result.affected ?? 0;
    } catch {
      this.logger.error('Rate-limit bucket cleanup failed.');
      return 0;
    } finally {
      this.cleanupInProgress = false;
    }
  }

  private async runMaintenance(): Promise<void> {
    const removed = await this.cleanupExpired();
    try {
      const activeBuckets = await this.repository.count();
      this.logger.log(
        JSON.stringify({
          event: 'rate_limit_maintenance_completed',
          activeBuckets,
          removed,
        }),
      );
    } catch {
      this.logger.error('Rate-limit cardinality measurement failed.');
    }
  }

  async enforce(input: {
    cost?: number;
    identity: string;
    limit: number;
    policyName: string;
    windowSeconds: number;
  }): Promise<void> {
    const result = await this.consume(input);
    if (result.allowed) return;
    throw new RateLimitExceededException(result.retryAfterSeconds);
  }
}
