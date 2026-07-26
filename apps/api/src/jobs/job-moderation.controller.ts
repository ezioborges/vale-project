import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ManagedJob, ManagedJobPage } from '@vale/shared';
import { Request } from 'express';

import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { RequireEmailVerified } from '../common/auth/email-verified.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RequireAcceptedTerms } from '../common/auth/terms.decorator';
import { ModerateJobDto, ModerationQueueQueryDto } from './dto/job.dto';
import { JobsService } from './jobs.service';

@ApiTags('moderation')
@ApiBearerAuth()
@Roles('coordinator', 'admin')
@RequireAcceptedTerms()
@RequireEmailVerified()
@Controller('moderation/jobs')
export class JobModerationController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  list(@Query() query: ModerationQueueQueryDto): Promise<ManagedJobPage> {
    return this.jobsService.listModerationQueue(query);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ManagedJob> {
    return this.jobsService.getManagedJob(id, user);
  }

  @Post(':id/decision')
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: ModerateJobDto,
    @Req() request: Request,
  ): Promise<ManagedJob> {
    return this.jobsService.moderateJob(id, user, body.decision, body.reason, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    });
  }
}
