import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { Application } from '../jobs/application.entity';
import { Job } from '../jobs/job.entity';
import { CandidateProfile } from '../profiles/candidate-profile.entity';
import { EmployerProfile } from '../profiles/employer-profile.entity';
import { User } from '../users/user.entity';
import { ModerationDecision } from './moderation-decision.entity';
import { ReportModerationController } from './report-moderation.controller';
import { Report } from './report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      ModerationDecision,
      Job,
      Application,
      CandidateProfile,
      EmployerProfile,
      User,
    ]),
    AuditModule,
  ],
  controllers: [ReportsController, ReportModerationController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
