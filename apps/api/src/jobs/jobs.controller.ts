import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  CandidateApplication,
  ManagedJob,
  ManagedJobPage,
  PublicJob,
  PublicJobPage,
  ReceivedApplicationPage,
} from '@vale/shared';
import { Request } from 'express';

import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { RequireEmailVerified } from '../common/auth/email-verified.decorator';
import { Public } from '../common/auth/public.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RequireAcceptedTerms } from '../common/auth/terms.decorator';
import {
  ApplicationListQueryDto,
  JobInputDto,
  JobSearchQueryDto,
  PaginationQueryDto,
  SubmitApplicationDto,
} from './dto/job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles('employer')
  @RequireAcceptedTerms()
  @RequireEmailVerified()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: JobInputDto,
    @Req() request: Request,
  ): Promise<ManagedJob> {
    return this.jobsService.createJob(user, body, this.context(request));
  }

  @Get('mine')
  @ApiBearerAuth()
  @Roles('employer')
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<ManagedJobPage> {
    return this.jobsService.listMyJobs(user, query);
  }

  @Get('mine/:id')
  @ApiBearerAuth()
  @Roles('employer')
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ManagedJob> {
    return this.jobsService.getManagedJob(id, user, false);
  }

  @Patch('mine/:id')
  @ApiBearerAuth()
  @Roles('employer')
  @RequireAcceptedTerms()
  @RequireEmailVerified()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: JobInputDto,
    @Req() request: Request,
  ): Promise<ManagedJob> {
    return this.jobsService.updateJob(id, user, body, this.context(request));
  }

  @Post('mine/:id/pause')
  @ApiBearerAuth()
  @Roles('employer')
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ManagedJob> {
    return this.jobsService.pauseJob(id, user, this.context(request));
  }

  @Post('mine/:id/resume')
  @ApiBearerAuth()
  @Roles('employer')
  resume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ManagedJob> {
    return this.jobsService.resumeJob(id, user, this.context(request));
  }

  @Post('mine/:id/close')
  @ApiBearerAuth()
  @Roles('employer')
  close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ManagedJob> {
    return this.jobsService.closeJob(id, user, this.context(request));
  }

  @Post('mine/:id/republish')
  @ApiBearerAuth()
  @Roles('employer')
  republish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ManagedJob> {
    return this.jobsService.republishJob(id, user, this.context(request));
  }

  @Get('mine/:id/applications')
  @ApiBearerAuth()
  @Roles('employer')
  listReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: ApplicationListQueryDto,
  ): Promise<ReceivedApplicationPage> {
    return this.jobsService.listReceivedApplications(id, user, query);
  }

  @Post(':id/applications')
  @ApiBearerAuth()
  @Roles('candidate')
  @RequireAcceptedTerms()
  @RequireEmailVerified()
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: SubmitApplicationDto,
    @Req() request: Request,
  ): Promise<CandidateApplication> {
    return this.jobsService.submitApplication(
      id,
      user,
      body.coverMessage,
      this.context(request),
    );
  }

  @Get()
  @Public()
  search(@Query() query: JobSearchQueryDto): Promise<PublicJobPage> {
    return this.jobsService.searchPublicJobs(query);
  }

  @Get(':id')
  @Public()
  detail(@Param('id') id: string): Promise<PublicJob> {
    return this.jobsService.getPublicJob(id);
  }

  private context(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}

