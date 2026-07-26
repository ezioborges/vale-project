import type { ApplicationStatus } from '@vale/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CandidateProfile } from '../profiles/candidate-profile.entity';
import { ApplicationResumeSnapshot } from './application-resume-snapshot.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';
import { apiApplicationStatuses } from './job.constants';
import { Job } from './job.entity';

@Entity('applications')
@Index(['jobId', 'candidateProfileId'], { unique: true })
@Index(['candidateProfileId', 'submittedAt'])
@Index(['jobId', 'status'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId!: string;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @Column({ name: 'candidate_profile_id', type: 'uuid' })
  candidateProfileId!: string;

  @ManyToOne(() => CandidateProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_profile_id' })
  candidateProfile!: CandidateProfile;

  @Column({
    type: 'enum',
    enum: apiApplicationStatuses,
    enumName: 'application_status',
    default: 'submitted',
  })
  status!: ApplicationStatus;

  @Column({ name: 'cover_message', type: 'text', nullable: true })
  coverMessage!: string | null;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => ApplicationStatusHistory, (history) => history.application)
  history!: ApplicationStatusHistory[];

  @OneToOne(() => ApplicationResumeSnapshot, (snapshot) => snapshot.application)
  resumeSnapshot!: ApplicationResumeSnapshot;
}

