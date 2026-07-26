import type {
  ReportDecisionAction,
  ReportPriority,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@vale/shared';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../jobs/dto/job.dto';
import {
  apiReportDecisionActions,
  apiReportPriorities,
  apiReportReasons,
  apiReportStatuses,
  apiReportTargetTypes,
} from '../report.constants';

export class CreateReportDto {
  @IsIn(apiReportTargetTypes)
  targetType!: ReportTargetType;

  @IsUUID()
  targetId!: string;

  @IsIn(apiReportReasons)
  reason!: ReportReason;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description!: string;
}

export class MyReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(apiReportStatuses)
  status?: ReportStatus;
}

export class ModerationReportsQueryDto extends MyReportsQueryDto {
  @IsOptional()
  @IsIn(apiReportPriorities)
  priority?: ReportPriority;

  @IsOptional()
  @IsIn(apiReportTargetTypes)
  targetType?: ReportTargetType;
}

export class DecideReportDto {
  @IsIn(apiReportDecisionActions)
  action!: ReportDecisionAction;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}

export class UpdateReportPriorityDto {
  @IsIn(apiReportPriorities)
  priority!: ReportPriority;
}
