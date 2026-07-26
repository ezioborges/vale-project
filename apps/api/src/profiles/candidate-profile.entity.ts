import type { CandidateProfileInput, ProfileVisibility } from '@vale/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity('candidate_profiles')
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'display_name', type: 'varchar', length: 120 })
  displayName!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  pronouns!: string | null;

  @Column({ type: 'varchar', length: 140, nullable: true })
  headline!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location!: string | null;

  @Column({ name: 'work_preferences', type: 'jsonb', default: {} })
  workPreferences!: CandidateProfileInput['workPreferences'];

  @Column({ type: 'jsonb', default: [] })
  skills!: CandidateProfileInput['skills'];

  @Column({ type: 'jsonb', default: [] })
  experiences!: CandidateProfileInput['experiences'];

  @Column({ type: 'jsonb', default: [] })
  education!: CandidateProfileInput['education'];

  @Column({ name: 'professional_links', type: 'jsonb', default: [] })
  professionalLinks!: CandidateProfileInput['professionalLinks'];

  @Index()
  @Column({
    type: 'enum',
    enum: ['private', 'applications_only', 'verified_employers'],
    enumName: 'profile_visibility',
    default: 'private',
  })
  visibility!: ProfileVisibility;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
