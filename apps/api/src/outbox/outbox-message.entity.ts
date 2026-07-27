import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const outboxMessageStatuses = [
  'pending',
  'processing',
  'sent',
  'retry_wait',
  'dead',
] as const;

export type OutboxMessageStatus = (typeof outboxMessageStatuses)[number];

@Entity('outbox_messages')
@Index(['status', 'availableAt'])
@Index(['leaseExpiresAt'])
export class OutboxMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'message_type', type: 'varchar', length: 80 })
  messageType!: string;

  @Column({ name: 'template_version', type: 'varchar', length: 32 })
  templateVersion!: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 80 })
  aggregateType!: string;

  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  @Index({ unique: true })
  @Column({ name: 'deduplication_key', type: 'varchar', length: 240 })
  deduplicationKey!: string;

  @Column({ name: 'encrypted_payload', type: 'text', nullable: true })
  encryptedPayload!: string | null;

  @Column({ name: 'payload_key_version', type: 'varchar', length: 32 })
  payloadKeyVersion!: string;

  @Column({
    type: 'enum',
    enum: outboxMessageStatuses,
    enumName: 'outbox_message_status',
    default: 'pending',
  })
  status!: OutboxMessageStatus;

  @Column({ type: 'integer', default: 0 })
  attempts!: number;

  @Column({ name: 'available_at', type: 'timestamptz' })
  availableAt!: Date;

  @Column({ name: 'lease_expires_at', type: 'timestamptz', nullable: true })
  leaseExpiresAt!: Date | null;

  @Column({
    name: 'last_error_code',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  lastErrorCode!: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'request_id', type: 'varchar', length: 128, nullable: true })
  requestId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
