import type { ApplicationStatus } from '@vale/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Application } from './application.entity';
import { apiApplicationStatuses } from './job.constants';

@Entity('application_status_history')
@Index(['applicationId', 'changedAt'])
export class ApplicationStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @ManyToOne(() => Application, (application) => application.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application!: Application;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_user_id' })
  actor!: User;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: apiApplicationStatuses,
    enumName: 'application_status',
    nullable: true,
  })
  fromStatus!: ApplicationStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: apiApplicationStatuses,
    enumName: 'application_status',
  })
  toStatus!: ApplicationStatus;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt!: Date;
}

