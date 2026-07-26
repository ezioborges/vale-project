import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuditEventPage } from '@vale/shared';

import { RequireEmailVerified } from '../common/auth/email-verified.decorator';
import { Roles } from '../common/auth/roles.decorator';
import { RequireAcceptedTerms } from '../common/auth/terms.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Roles('admin')
@RequireAcceptedTerms()
@RequireEmailVerified()
@Controller('audit-events')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: AuditQueryDto): Promise<AuditEventPage> {
    return this.auditService.list(query);
  }
}
