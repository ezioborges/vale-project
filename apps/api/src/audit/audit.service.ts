import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { AuditEventPage } from '@vale/shared';

import { AuditAction, AuditEvent } from './audit-event.entity';
import { AuditQueryDto } from './dto/audit-query.dto';

const auditContextAllowlist = {
  'auth.registration_succeeded': ['outcome'],
  'auth.login_succeeded': ['outcome'],
  'auth.login_failed': ['outcome', 'reason'],
  'auth.refresh_succeeded': ['outcome'],
  'auth.refresh_failed': ['outcome', 'reason'],
  'auth.logout': ['outcome'],
  'auth.email_verified': ['outcome'],
  'auth.password_reset': ['outcome', 'reason'],
  'user.role_changed': ['from', 'to', 'reason'],
  'user.suspended': ['from', 'to', 'reason'],
  'user.disabled': ['from', 'to', 'reason'],
  'user.reactivated': ['from', 'to', 'reason'],
  'candidate_profile.created': ['changedFields'],
  'candidate_profile.updated': ['changedFields'],
  'candidate_profile.visibility_changed': ['from', 'to'],
  'candidate_profile.activation_changed': ['from', 'to'],
  'employer_profile.created': ['changedFields'],
  'employer_profile.updated': ['changedFields'],
  'employer_profile.verification_reset': ['reason'],
  'profile_asset.replaced': ['kind', 'mimeType', 'sizeBytes'],
  'profile_asset.deleted': ['kind'],
  'profile_asset.downloaded': ['kind'],
  'profile_asset.scan_failed': ['kind', 'reason'],
  'job.created': ['jobId', 'status'],
  'job.updated': ['jobId', 'status', 'changedFields'],
  'job.moderation_decided': ['jobId', 'decision', 'status'],
  'job.paused': ['jobId', 'fromStatus', 'toStatus'],
  'job.resumed': ['jobId', 'fromStatus', 'toStatus'],
  'job.closed': ['jobId', 'fromStatus', 'toStatus'],
  'job.republished': ['jobId', 'fromStatus', 'toStatus'],
  'application.submitted': ['jobId', 'applicationId'],
  'application.status_changed': [
    'applicationId',
    'jobId',
    'fromStatus',
    'toStatus',
  ],
  'application.cancelled': ['applicationId', 'jobId'],
  'application.resume_downloaded': ['applicationId', 'jobId'],
  'report.created': ['reportId', 'targetType', 'targetId', 'reason'],
  'report.priority_changed': ['reportId', 'from', 'to'],
  'report.decision_recorded': [
    'reportId',
    'targetType',
    'targetId',
    'decision',
    'fromStatus',
    'toStatus',
  ],
  'job.reported': ['jobId', 'reportId', 'fromStatus'],
  'job.restored': ['jobId', 'reportId'],
} as const satisfies Record<AuditAction, readonly string[]>;

export type RecordAuditEvent = Pick<
  AuditEvent,
  'actorUserId' | 'targetUserId' | 'action'
> & {
  context?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly repository: Repository<AuditEvent>,
  ) {}

  async record(
    input: RecordAuditEvent,
    manager?: EntityManager,
  ): Promise<AuditEvent> {
    const repository = manager
      ? manager.getRepository(AuditEvent)
      : this.repository;

    return repository.save(
      repository.create({
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        action: input.action,
        context: this.allowlistedContext(input.action, input.context ?? {}),
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      }),
    );
  }

  async list(query: AuditQueryDto): Promise<AuditEventPage> {
    const builder = this.repository.createQueryBuilder('event');
    if (query.actorUserId) {
      builder.andWhere('event.actorUserId = :actorUserId', {
        actorUserId: query.actorUserId,
      });
    }
    if (query.targetUserId) {
      builder.andWhere('event.targetUserId = :targetUserId', {
        targetUserId: query.targetUserId,
      });
    }
    if (query.action?.trim()) {
      builder.andWhere('event.action = :action', {
        action: query.action.trim(),
      });
    }
    if (query.from) {
      builder.andWhere('event.createdAt >= :from', { from: query.from });
    }
    if (query.to) {
      builder.andWhere('event.createdAt <= :to', { to: query.to });
    }

    const [items, total] = await builder
      .orderBy('event.createdAt', 'DESC')
      .addOrderBy('event.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      items: items.map((event) => ({
        id: event.id,
        actorUserId: event.actorUserId,
        targetUserId: event.targetUserId,
        action: event.action,
        context: event.context,
        createdAt: event.createdAt.toISOString(),
      })),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }

  private allowlistedContext(
    action: AuditAction,
    context: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of auditContextAllowlist[action]) {
      if (!Object.prototype.hasOwnProperty.call(context, key)) continue;
      const value = this.safeContextValue(context[key]);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }

  private safeContextValue(value: unknown): unknown {
    if (
      value === null ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      return value;
    }
    if (typeof value === 'string') {
      return value.slice(0, 500);
    }
    if (Array.isArray(value)) {
      return value
        .slice(0, 50)
        .map((item) => this.safeContextValue(item))
        .filter((item) => item !== undefined && !Array.isArray(item));
    }
    return undefined;
  }
}
