import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { AuditEventPage } from '@vale/shared';

import { AuditEvent } from './audit-event.entity';
import { AuditQueryDto } from './dto/audit-query.dto';

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
        context: input.context ?? {},
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
}
