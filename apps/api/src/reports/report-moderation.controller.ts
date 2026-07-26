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
import type { ModerationReport, ModerationReportPage } from '@vale/shared';
import { Request } from 'express';

import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { RequireEmailVerified } from '../common/auth/email-verified.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RequireAcceptedTerms } from '../common/auth/terms.decorator';
import {
  DecideReportDto,
  ModerationReportsQueryDto,
  UpdateReportPriorityDto,
} from './dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('moderation')
@ApiBearerAuth()
@Roles('coordinator', 'admin')
@RequireAcceptedTerms()
@RequireEmailVerified()
@Controller('moderation/reports')
export class ReportModerationController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  list(
    @Query() query: ModerationReportsQueryDto,
  ): Promise<ModerationReportPage> {
    return this.reportsService.listForModeration(query);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<ModerationReport> {
    return this.reportsService.getForModeration(id);
  }

  @Patch(':id/priority')
  updatePriority(
    @Param('id') id: string,
    @Body() body: UpdateReportPriorityDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<ModerationReport> {
    return this.reportsService.updatePriority(
      id,
      body.priority,
      user,
      this.context(request),
    );
  }

  @Post(':id/decision')
  decide(
    @Param('id') id: string,
    @Body() body: DecideReportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<ModerationReport> {
    return this.reportsService.decide(
      id,
      body.action,
      body.reason,
      user,
      this.context(request),
    );
  }

  private context(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
