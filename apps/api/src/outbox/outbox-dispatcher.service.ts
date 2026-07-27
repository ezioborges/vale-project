import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In } from 'typeorm';

import { Env } from '../common/config/env.validation';
import { EmailService } from '../email/email.service';
import { OutboxMessage } from './outbox-message.entity';
import { OutboxPayloadCipherService } from './outbox-payload-cipher.service';

@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly cipher: OutboxPayloadCipherService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    if (!this.configService.get('OUTBOX_DISPATCH_ENABLED', { infer: true })) {
      return;
    }
    void this.dispatchCycle();
    this.timer = setInterval(
      () => void this.dispatchCycle(),
      this.configService.get('OUTBOX_POLL_INTERVAL_SECONDS', { infer: true }) *
        1000,
    );
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async dispatchCycle(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const messages = await this.reserveBatch();
      for (const message of messages) {
        await this.dispatch(message);
      }
    } finally {
      this.running = false;
    }
  }

  dispatchOnce(): Promise<void> {
    return this.dispatchCycle();
  }

  private async reserveBatch(): Promise<OutboxMessage[]> {
    return this.dataSource.transaction(async (manager) => {
      const rows = (await manager.query(
        `SELECT id
         FROM outbox_messages
         WHERE (status IN ('pending', 'retry_wait') AND available_at <= now())
            OR (status = 'processing' AND lease_expires_at <= now())
         ORDER BY available_at ASC, created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $1`,
        [
          this.configService.get('OUTBOX_DISPATCH_BATCH_SIZE', {
            infer: true,
          }),
        ],
      )) as Array<{ id: string }>;
      if (!rows.length) return [];

      const now = new Date();
      const leaseExpiresAt = new Date(
        now.getTime() +
          this.configService.get('OUTBOX_LEASE_SECONDS', { infer: true }) *
            1000,
      );
      const ids = rows.map((row) => row.id);
      await manager.getRepository(OutboxMessage).update(
        { id: In(ids) },
        {
          status: 'processing',
          leaseExpiresAt,
          attempts: () => 'attempts + 1',
        },
      );
      return manager.getRepository(OutboxMessage).findBy({ id: In(ids) });
    });
  }

  private async dispatch(message: OutboxMessage): Promise<void> {
    try {
      if (message.expiresAt && message.expiresAt <= new Date()) {
        await this.dead(message, 'expired');
        return;
      }
      if (!message.encryptedPayload) {
        await this.dead(message, 'payload_missing');
        return;
      }
      await this.emailService.sendOutboxMessage(
        message.messageType,
        this.cipher.decrypt(message.encryptedPayload),
      );
      await this.dataSource.getRepository(OutboxMessage).update(
        { id: message.id, status: 'processing' },
        {
          status: 'sent',
          sentAt: new Date(),
          leaseExpiresAt: null,
          lastErrorCode: null,
          encryptedPayload: null,
        },
      );
    } catch (error) {
      const maxAttempts = this.configService.get('OUTBOX_MAX_ATTEMPTS', {
        infer: true,
      });
      if (message.attempts >= maxAttempts) {
        await this.dead(message, this.errorCode(error));
      } else {
        const delay = this.backoffMilliseconds(message.attempts);
        await this.dataSource.getRepository(OutboxMessage).update(
          { id: message.id, status: 'processing' },
          {
            status: 'retry_wait',
            availableAt: new Date(Date.now() + delay),
            leaseExpiresAt: null,
            lastErrorCode: this.errorCode(error),
          },
        );
      }
      this.logger.warn(`Outbox delivery failed with ${this.errorCode(error)}.`);
    }
  }

  private async dead(message: OutboxMessage, errorCode: string): Promise<void> {
    await this.dataSource
      .getRepository(OutboxMessage)
      .update(
        { id: message.id, status: 'processing' },
        { status: 'dead', leaseExpiresAt: null, lastErrorCode: errorCode },
      );
  }

  private backoffMilliseconds(attempt: number): number {
    const capped = Math.min(attempt, 8);
    const base = Math.min(60 * 60 * 1000, 1000 * 2 ** capped);
    return base + Math.floor(Math.random() * Math.min(30_000, base / 4));
  }

  private errorCode(error: unknown): string {
    if (error instanceof Error) {
      return error.name === 'Error'
        ? 'delivery_failed'
        : error.name.slice(0, 80);
    }
    return 'delivery_failed';
  }
}
