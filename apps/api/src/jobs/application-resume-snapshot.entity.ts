import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Application } from './application.entity';

@Entity('application_resume_snapshots')
export class ApplicationResumeSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @OneToOne(() => Application, (application) => application.resumeSnapshot, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application!: Application;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;

  @Index({ unique: true })
  @Column({ name: 'storage_key', type: 'text' })
  storageKey!: string;

  @Column({ name: 'retention_until', type: 'timestamptz' })
  retentionUntil!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
