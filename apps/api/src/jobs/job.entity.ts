import type {
  ContractType,
  JobSeniority,
  JobStatus,
  WorkMode,
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

import { EmployerProfile } from '../profiles/employer-profile.entity';
import { User } from '../users/user.entity';
import { Application } from './application.entity';
import {
  apiContractTypes,
  apiJobSeniorities,
  apiJobStatuses,
  apiWorkModes,
} from './job.constants';

@Entity('jobs')
@Index(['status', 'publishedAt'])
@Index(['status', 'areaNormalized'])
@Index(['status', 'workMode', 'contractType', 'seniority'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'employer_profile_id', type: 'uuid' })
  employerProfileId!: string;

  @ManyToOne(() => EmployerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employer_profile_id' })
  employerProfile!: EmployerProfile;

  @Index()
  @Column({ name: 'owner_user_id', type: 'uuid' })
  ownerUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'varchar', length: 100 })
  area!: string;

  @Column({ name: 'area_normalized', type: 'varchar', length: 100 })
  areaNormalized!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  responsibilities!: string | null;

  @Column({ type: 'text', nullable: true })
  requirements!: string | null;

  @Column({ type: 'text', nullable: true })
  benefits!: string | null;

  @Column({ type: 'varchar', length: 120 })
  location!: string;

  @Column({
    name: 'work_mode',
    type: 'enum',
    enum: apiWorkModes,
    enumName: 'work_mode',
  })
  workMode!: WorkMode;

  @Column({
    name: 'contract_type',
    type: 'enum',
    enum: apiContractTypes,
    enumName: 'contract_type',
  })
  contractType!: ContractType;

  @Column({
    type: 'enum',
    enum: apiJobSeniorities,
    enumName: 'job_seniority',
  })
  seniority!: JobSeniority;

  @Column({ name: 'salary_min', type: 'integer', nullable: true })
  salaryMin!: number | null;

  @Column({ name: 'salary_max', type: 'integer', nullable: true })
  salaryMax!: number | null;

  @Column({ name: 'salary_hidden_reason', type: 'varchar', length: 300, nullable: true })
  salaryHiddenReason!: string | null;

  @Column({ name: 'accessibility_info', type: 'text', nullable: true })
  accessibilityInfo!: string | null;

  @Column({ name: 'inclusion_commitment', type: 'boolean' })
  inclusionCommitment!: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: apiJobStatuses,
    enumName: 'job_status',
    default: 'pending_review',
  })
  status!: JobStatus;

  @Column({ name: 'moderation_reason', type: 'text', nullable: true })
  moderationReason!: string | null;

  @Column({ name: 'moderated_by_user_id', type: 'uuid', nullable: true })
  moderatedByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'moderated_by_user_id' })
  moderatedBy!: User | null;

  @Column({ name: 'moderated_at', type: 'timestamptz', nullable: true })
  moderatedAt!: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Application, (application) => application.job)
  applications!: Application[];
}

