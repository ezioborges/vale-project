import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  CandidateApplication,
  CandidateApplicationPage,
  ReceivedApplication,
} from '@vale/shared';
import { Request, Response } from 'express';

import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Roles } from '../common/auth/roles.decorator';
import {
  ApplicationListQueryDto,
  UpdateApplicationStatusDto,
} from './dto/job.dto';
import { JobsService } from './jobs.service';

@ApiTags('applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('mine')
  @Roles('candidate')
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ApplicationListQueryDto,
  ): Promise<CandidateApplicationPage> {
    return this.jobsService.listMyApplications(user, query);
  }

  @Post('mine/:id/cancel')
  @Roles('candidate')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<CandidateApplication> {
    return this.jobsService.cancelApplication(
      id,
      user,
      this.context(request),
    );
  }

  @Patch(':id/status')
  @Roles('employer')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateApplicationStatusDto,
    @Req() request: Request,
  ): Promise<ReceivedApplication> {
    return this.jobsService.updateApplicationStatus(
      id,
      user,
      body.status,
      this.context(request),
    );
  }

  @Get(':id/resume')
  @Roles('candidate', 'employer', 'coordinator', 'admin')
  async downloadResume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.jobsService.downloadApplicationResume(
      id,
      user,
      this.context(request),
    );
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${this.asciiFileName(file.fileName)}"`,
      'Content-Length': String(file.sizeBytes),
      'Content-Type': file.mimeType,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(file.content);
  }

  private context(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }

  private asciiFileName(fileName: string): string {
    return (
      fileName
        .normalize('NFKD')
        .replace(/[^\x20-\x7e]/g, '')
        .replace(/["\\]/g, '_')
        .slice(0, 180) || 'curriculo.pdf'
    );
  }
}

