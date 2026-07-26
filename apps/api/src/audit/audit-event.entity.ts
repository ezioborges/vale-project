import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditAction =
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
  | 'profile_asset.deleted';

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
