import type {
  ReportPriority,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@vale/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { ModerationDecision } from './moderation-decision.entity';
import {
  apiReportPriorities,
  apiReportReasons,
  apiReportStatuses,
  apiReportTargetTypes,
} from './report.constants';

@Entity('reports')
@Index(['status', 'priority', 'createdAt'])
@Index(['targetType', 'targetId'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'reporter_user_id', type: 'uuid' })
  reporterUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporter_user_id' })
  reporter!: User;

  @Index()
  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: apiReportTargetTypes,
    enumName: 'report_target_type',
  })
  targetType!: ReportTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId!: string;

  @Column({
    type: 'enum',
    enum: apiReportReasons,
    enumName: 'report_reason',
  })
  reason!: ReportReason;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: apiReportStatuses,
    enumName: 'report_status',
    default: 'open',
  })
  status!: ReportStatus;

  @Column({
    type: 'enum',
    enum: apiReportPriorities,
    enumName: 'report_priority',
    default: 'normal',
  })
  priority!: ReportPriority;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => ModerationDecision, (decision) => decision.report)
  decisions!: ModerationDecision[];
}
