import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { AuditEvent } from './audit-event.entity';

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
}
