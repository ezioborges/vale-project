import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';

import { RequestContextService } from '../common/observability/request-context.service';
import { Env } from '../common/config/env.validation';
import { EmailMessage } from '../email/email-sender';
import { OutboxMessage } from './outbox-message.entity';
import { OutboxPayloadCipherService } from './outbox-payload-cipher.service';

export type EnqueueOutboxMessage = {
  messageType: 'email' | 'email_verification' | 'password_reset';
  templateVersion: string;
  aggregateType: string;
  aggregateId: string;
  deduplicationKey: string;
  payload: Record<string, unknown>;
  expiresAt?: Date | null;
};

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxMessage)
    private readonly repository: Repository<OutboxMessage>,
    private readonly cipher: OutboxPayloadCipherService,
    private readonly configService: ConfigService<Env, true>,
    private readonly requestContext: RequestContextService,
  ) {}

  async enqueue(
    input: EnqueueOutboxMessage,
    manager?: EntityManager,
  ): Promise<OutboxMessage> {
    const repository = manager
      ? manager.getRepository(OutboxMessage)
      : this.repository;
    const message = repository.create({
      messageType: input.messageType,
      templateVersion: input.templateVersion,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      deduplicationKey: input.deduplicationKey,
      encryptedPayload: this.cipher.encrypt(input.payload),
      payloadKeyVersion: this.configService.get('OUTBOX_KEY_VERSION', {
        infer: true,
      }),
      status: 'pending',
      attempts: 0,
      availableAt: new Date(),
      leaseExpiresAt: null,
      lastErrorCode: null,
      sentAt: null,
      expiresAt: input.expiresAt ?? null,
      requestId: this.requestContext.requestId ?? null,
    });

    try {
      return await repository.save(message);
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      const existing = await repository.findOneBy({
        deduplicationKey: input.deduplicationKey,
      });
      if (!existing) throw error;
      return existing;
    }
  }

  async replay(messageId: string): Promise<void> {
    const result = await this.repository.update(
      { id: messageId, status: 'dead' },
      {
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
        leaseExpiresAt: null,
        lastErrorCode: null,
      },
    );
    if (!result.affected) {
      throw new NotFoundException('Dead outbox message not found.');
    }
  }

  enqueueEmail(
    manager: EntityManager,
    input: {
      aggregateId: string;
      deduplicationKey: string;
      templateVersion: string;
      message: EmailMessage;
    },
  ): Promise<OutboxMessage> {
    return this.enqueue(
      {
        messageType: 'email',
        templateVersion: input.templateVersion,
        aggregateType: 'user',
        aggregateId: input.aggregateId,
        deduplicationKey: input.deduplicationKey,
        payload: { message: input.message },
      },
      manager,
    );
  }

  deduplicationKey(
    type: string,
    aggregateId: string,
    uniqueValue: string,
  ): string {
    const digest = createHash('sha256')
      .update(`${type}:${aggregateId}:${uniqueValue}`)
      .digest('hex');
    return `${type}:${aggregateId}:${digest}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    );
  }
}
