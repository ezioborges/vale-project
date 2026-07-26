import type {
  ContractType,
  JobModerationDecision,
  JobSeniority,
  JobStatus,
  WorkMode,
} from '@vale/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import {
  apiContractTypes,
  apiJobModerationDecisions,
  apiJobSeniorities,
  apiJobStatuses,
  apiWorkModes,
} from '../job.constants';

export class JobInputDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  area!: string;

  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  responsibilities!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  requirements!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  benefits!: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location!: string;

  @IsIn(apiWorkModes)
  workMode!: WorkMode;

  @IsIn(apiContractTypes)
  contractType!: ContractType;

  @IsIn(apiJobSeniorities)
  seniority!: JobSeniority;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin!: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax!: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  salaryHiddenReason!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  accessibilityInfo!: string | null;

  @IsBoolean()
  inclusionCommitment!: boolean;
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}

export class JobSearchQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsIn(apiWorkModes)
  workMode?: WorkMode;

  @IsOptional()
  @IsIn(apiContractTypes)
  contractType?: ContractType;

  @IsOptional()
  @IsIn(apiJobSeniorities)
  seniority?: JobSeniority;
}

export class ModerationQueueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(apiJobStatuses)
  status: JobStatus = 'pending_review';
}

export class ModerateJobDto {
  @IsIn(apiJobModerationDecisions)
  decision!: JobModerationDecision;

  @ValidateIf((input: ModerateJobDto) => input.decision !== 'approve')
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason?: string;
}

export class SubmitApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  coverMessage?: string | null;
}

export class UpdateApplicationStatusDto {
  @IsIn(['under_review', 'shortlisted', 'rejected'])
  status!: 'under_review' | 'shortlisted' | 'rejected';
}

export class ApplicationListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsIn(['submitted', 'under_review', 'shortlisted', 'rejected', 'cancelled'])
  status?: string;
}
