import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';

import { Env } from '../config/env.validation';
import { IdempotencyRecord } from './idempotency-record.entity';

const keyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,254}$/;

export type IdempotencyInput = {
  actorUserId: string;
  method: 'POST';
  route: '/jobs' | '/applications';
  key: string | undefined;
  payload: unknown;
  resourceType: 'job' | 'application';
  contractVersion: string;
};

export type IdempotencyResult = {
  resourceId: string;
  replayed: boolean;
};

@Injectable()
export class IdempotencyService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async execute(
    input: IdempotencyInput,
    callback: (manager: EntityManager, recordId: string) => Promise<string>,
  ): Promise<IdempotencyResult> {
    if (!input.key) {
      if (this.configService.get('IDEMPOTENCY_REQUIRED', { infer: true })) {
        throw new BadRequestException(
          'A valid Idempotency-Key header is required for this operation.',
        );
      }
      const resourceId = await this.dataSource.transaction((manager) =>
        callback(manager, randomUUID()),
      );
      return { resourceId, replayed: false };
    }
    if (!keyPattern.test(input.key)) {
      throw new BadRequestException('Idempotency-Key has an invalid format.');
    }

    const keyHash = this.sha256(input.key);
    const fingerprint = this.sha256(this.canonicalize(input.payload));
    const recordId = this.stableRecordId(
      input.actorUserId,
      input.method,
      input.route,
      keyHash,
    );

    return this.dataSource.transaction(async (manager) => {
      const inserted = (await manager.query(
        `INSERT INTO idempotency_records
          (id, actor_user_id, method, route, key_hash, fingerprint, status, contract_version,
           resource_type, lease_expires_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8,
                 now() + interval '5 minutes', NULL)
         ON CONFLICT (actor_user_id, method, route, key_hash) DO NOTHING
         RETURNING id`,
        [
          recordId,
          input.actorUserId,
          input.method,
          input.route,
          keyHash,
          fingerprint,
          input.contractVersion,
          input.resourceType,
        ],
      )) as Array<{ id: string }>;

      const record = await manager
        .getRepository(IdempotencyRecord)
        .findOneOrFail({
          where: {
            actorUserId: input.actorUserId,
            method: input.method,
            route: input.route,
            keyHash,
          },
          lock: { mode: 'pessimistic_write' },
        });

      if (record.fingerprint !== fingerprint) {
        throw new ConflictException({
          code: 'idempotency_key_payload_mismatch',
          message: 'Idempotency key was already used with a different request.',
        });
      }
      if (record.status === 'completed' && record.resourceId) {
        return { resourceId: record.resourceId, replayed: true };
      }
      if (
        !inserted.length &&
        record.leaseExpiresAt &&
        record.leaseExpiresAt > new Date()
      ) {
        throw new ConflictException({
          code: 'idempotency_operation_processing',
          message: 'The original operation is still being processed.',
        });
      }

      record.status = 'processing';
      record.leaseExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      const resourceId = await callback(manager, record.id);
      record.status = 'completed';
      record.resourceId = resourceId;
      record.resourceType = input.resourceType;
      record.httpStatus = 201;
      record.completedAt = new Date();
      record.leaseExpiresAt = null;
      await manager.getRepository(IdempotencyRecord).save(record);
      return { resourceId, replayed: false };
    });
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private stableRecordId(
    actorUserId: string,
    method: string,
    route: string,
    keyHash: string,
  ): string {
    const hex = this.sha256(`${actorUserId}:${method}:${route}:${keyHash}`);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }

  private canonicalize(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalize(item)).join(',')}]`;
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, item]) => `${JSON.stringify(key)}:${this.canonicalize(item)}`,
      );
    return `{${entries.join(',')}}`;
  }
}
