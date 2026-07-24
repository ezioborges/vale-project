import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { RateLimitCounter } from './rate-limit-counter.entity';

@Injectable()
export class RateLimitService {
  constructor(
    @InjectRepository(RateLimitCounter)
    private readonly repository: Repository<RateLimitCounter>,
  ) {}

  async consume(input: {
    identity: string;
    policyName: string;
    limit: number;
    windowSeconds: number;
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

    await this.repository.delete({ expiresAt: LessThan(new Date(now)) });
    const rows = (await this.repository.query(
      `
        INSERT INTO "rate_limit_counters" ("key", "hits", "expires_at")
        VALUES ($1, 1, $2)
        ON CONFLICT ("key") DO UPDATE
        SET "hits" = "rate_limit_counters"."hits" + 1
        RETURNING "hits"
      `,
      [key, expiresAt],
    )) as Array<{ hits: number | string }>;
    const hits = Number(rows[0]?.hits ?? 1);

    return {
      allowed: hits <= input.limit,
      remaining: Math.max(0, input.limit - hits),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((expiresAt.getTime() - now) / 1000),
      ),
    };
  }
}
