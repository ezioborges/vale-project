import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';

import { Env } from '../common/config/env.validation';
import { FILE_STORAGE, FileStorage } from '../profiles/file-storage';

const RETENTION_ADVISORY_LOCK = 73_019_301;

type ExpiredSnapshotRow = {
  id: string;
  storage_key: string;
  retention_until: Date | string;
};

export type RetentionRunMetrics = {
  acquiredLock: boolean;
  durationMilliseconds: number;
  expired: number;
  failed: number;
  hasMore: boolean;
  oldestExpiredAgeSeconds: number | null;
  removed: number;
};

@Injectable()
export class ApplicationRetentionService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ApplicationRetentionService.name);
  private timer?: NodeJS.Timeout;
  private lastRun: RetentionRunMetrics | null = null;
  private scheduledRunInProgress = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<Env, true>,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.runScheduledCycle();
    const intervalMilliseconds =
      this.configService.get('RETENTION_JOB_INTERVAL_SECONDS', {
        infer: true,
      }) * 1000;
    this.timer = setInterval(() => {
      void this.runScheduledCycle();
    }, intervalMilliseconds);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  getLastRunMetrics(): RetentionRunMetrics | null {
    return this.lastRun ? { ...this.lastRun } : null;
  }

  async purgeExpired(now = new Date()): Promise<number> {
    return (await this.runCycle(now)).removed;
  }

  async runCycle(now = new Date()): Promise<RetentionRunMetrics> {
    const startedAt = Date.now();
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    let acquiredLock = false;
    let expired = 0;
    let removed = 0;
    let failed = 0;
    let oldestExpiredAgeSeconds: number | null = null;
    try {
      const lockRows = (await runner.query(
        'SELECT pg_try_advisory_lock($1) AS acquired',
        [RETENTION_ADVISORY_LOCK],
      )) as Array<{ acquired: boolean }>;
      acquiredLock = lockRows[0]?.acquired === true;
      if (!acquiredLock) {
        return this.completeMetrics({
          acquiredLock: false,
          durationMilliseconds: Date.now() - startedAt,
          expired: 0,
          failed: 0,
          hasMore: false,
          oldestExpiredAgeSeconds: null,
          removed: 0,
        });
      }

      const queue = await this.queueMetrics(runner, now);
      expired = queue.expired;
      oldestExpiredAgeSeconds = queue.oldestExpiredAgeSeconds;
      const batchSize = this.configService.get('RETENTION_JOB_BATCH_SIZE', {
        infer: true,
      });
      const maxItems = this.configService.get(
        'RETENTION_JOB_MAX_ITEMS_PER_CYCLE',
        { infer: true },
      );
      const attemptedIds = new Set<string>();

      while (attemptedIds.size < maxItems) {
        const remaining = maxItems - attemptedIds.size;
        const rows = await this.lockBatch(
          runner,
          now,
          Math.min(batchSize, remaining),
          [...attemptedIds],
        );
        if (rows.length === 0) break;

        try {
          for (const snapshot of rows) {
            attemptedIds.add(snapshot.id);
            try {
              await this.storage.delete(snapshot.storage_key);
              const result = (await runner.query(
                'DELETE FROM "application_resume_snapshots" WHERE "id" = $1 RETURNING "id"',
                [snapshot.id],
              )) as Array<{ id: string }>;
              if (result.length > 0) {
                removed += 1;
              }
            } catch {
              failed += 1;
              this.logger.error('Application resume snapshot purge failed.');
            }
          }
          await runner.commitTransaction();
        } catch (error) {
          if (runner.isTransactionActive) {
            await runner.rollbackTransaction();
          }
          throw error;
        }

        if (rows.length < batchSize) break;
      }

      const remainingQueue = await this.queueMetrics(runner, now);
      return this.completeMetrics({
        acquiredLock,
        durationMilliseconds: Date.now() - startedAt,
        expired,
        failed,
        hasMore: remainingQueue.expired > 0,
        oldestExpiredAgeSeconds,
        removed,
      });
    } finally {
      if (runner.isTransactionActive) {
        await runner.rollbackTransaction().catch(() => undefined);
      }
      if (acquiredLock) {
        await runner
          .query('SELECT pg_advisory_unlock($1)', [RETENTION_ADVISORY_LOCK])
          .catch(() => undefined);
      }
      await runner.release();
    }
  }

  private async runScheduledCycle(): Promise<void> {
    if (this.scheduledRunInProgress) return;
    this.scheduledRunInProgress = true;
    try {
      const metrics = await this.runCycle();
      this.logger.log(
        JSON.stringify({ event: 'retention_cycle_completed', ...metrics }),
      );
      const alertAgeSeconds = this.configService.get(
        'RETENTION_ALERT_AGE_SECONDS',
        { infer: true },
      );
      if (
        metrics.oldestExpiredAgeSeconds !== null &&
        metrics.oldestExpiredAgeSeconds > alertAgeSeconds
      ) {
        this.logger.warn(
          JSON.stringify({
            event: 'retention_sla_exceeded',
            oldestExpiredAgeSeconds: metrics.oldestExpiredAgeSeconds,
          }),
        );
      }
    } catch {
      this.logger.error('Application retention cycle failed.');
    } finally {
      this.scheduledRunInProgress = false;
    }
  }

  private async lockBatch(
    runner: QueryRunner,
    now: Date,
    limit: number,
    excludedIds: string[],
  ): Promise<ExpiredSnapshotRow[]> {
    await runner.startTransaction();
    return (await runner.query(
      `
        SELECT snapshot."id", snapshot."storage_key", snapshot."retention_until"
        FROM "application_resume_snapshots" snapshot
        INNER JOIN "applications" application
          ON application."id" = snapshot."application_id"
        INNER JOIN "jobs" job ON job."id" = application."job_id"
        WHERE snapshot."retention_until" <= $1
          AND (
            cardinality($3::uuid[]) = 0
            OR snapshot."id" <> ALL($3::uuid[])
          )
          AND (
            application."status" IN ('rejected', 'cancelled')
            OR job."status" = 'closed'
          )
        ORDER BY snapshot."retention_until" ASC, snapshot."id" ASC
        FOR UPDATE OF snapshot SKIP LOCKED
        LIMIT $2
      `,
      [now, limit, excludedIds],
    )) as ExpiredSnapshotRow[];
  }

  private async queueMetrics(
    runner: QueryRunner,
    now: Date,
  ): Promise<{
    expired: number;
    oldestExpiredAgeSeconds: number | null;
  }> {
    const rows = (await runner.query(
      `
        SELECT
          count(*)::integer AS "expired",
          EXTRACT(EPOCH FROM ($1::timestamptz - min(snapshot."retention_until")))
            AS "oldest_age_seconds"
        FROM "application_resume_snapshots" snapshot
        INNER JOIN "applications" application
          ON application."id" = snapshot."application_id"
        INNER JOIN "jobs" job ON job."id" = application."job_id"
        WHERE snapshot."retention_until" <= $1
          AND (
            application."status" IN ('rejected', 'cancelled')
            OR job."status" = 'closed'
          )
      `,
      [now],
    )) as Array<{
      expired: number | string;
      oldest_age_seconds: number | string | null;
    }>;
    const row = rows[0];
    return {
      expired: Number(row?.expired ?? 0),
      oldestExpiredAgeSeconds:
        row?.oldest_age_seconds === null ||
        row?.oldest_age_seconds === undefined
          ? null
          : Math.max(0, Math.floor(Number(row.oldest_age_seconds))),
    };
  }

  private completeMetrics(metrics: RetentionRunMetrics): RetentionRunMetrics {
    this.lastRun = metrics;
    return metrics;
  }
}
