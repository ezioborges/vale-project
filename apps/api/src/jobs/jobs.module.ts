import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { CandidateProfile } from '../profiles/candidate-profile.entity';
import { EmployerProfile } from '../profiles/employer-profile.entity';
import { ProfileAsset } from '../profiles/profile-asset.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { ApplicationResumeSnapshot } from './application-resume-snapshot.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';
import { Application } from './application.entity';
import { ApplicationsController } from './applications.controller';
import { JobModerationController } from './job-moderation.controller';
import { Job } from './job.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      Application,
      ApplicationStatusHistory,
      ApplicationResumeSnapshot,
      CandidateProfile,
      EmployerProfile,
      ProfileAsset,
    ]),
    AuditModule,
    ProfilesModule,
  ],
  controllers: [
    JobsController,
    ApplicationsController,
    JobModerationController,
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

