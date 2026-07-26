import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { MyReport, MyReportPage } from '@vale/shared';
import { Request } from 'express';

import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { RequireEmailVerified } from '../common/auth/email-verified.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RequireAcceptedTerms } from '../common/auth/terms.decorator';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { CreateReportDto, MyReportsQueryDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@RequireAcceptedTerms()
@RequireEmailVerified()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles('candidate', 'employer', 'coordinator', 'admin')
  @RateLimit({
    name: 'reports:create',
    buckets: [
      { name: 'user', identities: ['user'], limit: 10, windowSeconds: 3600 },
      {
        name: 'target',
        identities: [
          'user',
          { body: 'targetType', normalize: 'lowercase' },
          { body: 'targetId', normalize: 'lowercase' },
        ],
        limit: 3,
        windowSeconds: 86_400,
      },
    ],
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateReportDto,
    @Req() request: Request,
  ): Promise<MyReport> {
    return this.reportsService.create(user, body, this.context(request));
  }

  @Get('mine')
  @Roles('candidate', 'employer', 'coordinator', 'admin')
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MyReportsQueryDto,
  ): Promise<MyReportPage> {
    return this.reportsService.listMine(user, query);
  }

  private context(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
