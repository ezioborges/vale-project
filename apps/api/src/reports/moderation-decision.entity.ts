import type { ReportDecisionAction, ReportStatus } from '@vale/shared';
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
import {
  apiReportDecisionActions,
  apiReportStatuses,
} from './report.constants';
import { Report } from './report.entity';

@Entity('moderation_decisions')
@Index(['reportId', 'createdAt'])
export class ModerationDecision {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @ManyToOne(() => Report, (report) => report.decisions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_id' })
  report!: Report;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_user_id' })
  actor!: User;

  @Column({
    type: 'enum',
    enum: apiReportDecisionActions,
    enumName: 'report_decision_action',
  })
  action!: ReportDecisionAction;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: apiReportStatuses,
    enumName: 'report_status',
  })
  fromStatus!: ReportStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: apiReportStatuses,
    enumName: 'report_status',
  })
  toStatus!: ReportStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
