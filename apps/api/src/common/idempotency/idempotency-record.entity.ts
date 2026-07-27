import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const idempotencyRecordStatuses = [
  'processing',
  'completed',
  'failed_retryable',
] as const;

export type IdempotencyRecordStatus =
  (typeof idempotencyRecordStatuses)[number];

@Entity('idempotency_records')
@Index(['actorUserId', 'method', 'route', 'keyHash'], { unique: true })
@Index(['status', 'expiresAt'])
export class IdempotencyRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId!: string;

  @Column({ type: 'varchar', length: 8 })
  method!: string;

  @Column({ type: 'varchar', length: 160 })
  route!: string;

  @Column({ name: 'key_hash', type: 'char', length: 64 })
  keyHash!: string;

  @Column({ name: 'fingerprint', type: 'char', length: 64 })
  fingerprint!: string;

  @Column({
    type: 'enum',
    enum: idempotencyRecordStatuses,
    enumName: 'idempotency_record_status',
  })
  status!: IdempotencyRecordStatus;

  @Column({
    name: 'resource_type',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  resourceType!: string | null;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Column({ name: 'http_status', type: 'smallint', nullable: true })
  httpStatus!: number | null;

  @Column({ name: 'contract_version', type: 'varchar', length: 32 })
  contractVersion!: string;

  @Column({ name: 'lease_expires_at', type: 'timestamptz', nullable: true })
  leaseExpiresAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
