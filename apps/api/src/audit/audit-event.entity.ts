import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditAction =
  | 'auth.registration_succeeded'
  | 'auth.login_succeeded'
  | 'auth.login_failed'
  | 'auth.refresh_succeeded'
  | 'auth.refresh_failed'
  | 'auth.logout'
  | 'auth.email_verified'
  | 'auth.password_reset'
  | 'user.role_changed'
  | 'user.suspended'
  | 'user.disabled'
  | 'user.reactivated'
  | 'candidate_profile.created'
  | 'candidate_profile.updated'
  | 'candidate_profile.visibility_changed'
  | 'candidate_profile.activation_changed'
  | 'employer_profile.created'
  | 'employer_profile.updated'
  | 'employer_profile.verification_reset'
  | 'profile_asset.replaced'
  | 'profile_asset.deleted'
  | 'profile_asset.downloaded'
  | 'profile_asset.scan_failed'
  | 'job.created'
  | 'job.updated'
  | 'job.moderation_decided'
  | 'job.paused'
  | 'job.resumed'
  | 'job.closed'
  | 'job.republished'
  | 'application.submitted'
  | 'application.status_changed'
  | 'application.cancelled'
  | 'application.resume_downloaded'
  | 'report.created'
  | 'report.priority_changed'
  | 'report.decision_recorded'
  | 'job.reported'
  | 'job.restored';

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId!: string;

  @Index()
  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId!: string;

  @Column({ type: 'text' })
  action!: AuditAction;

  @Column({ type: 'jsonb', default: {} })
  context!: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
