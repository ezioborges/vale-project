import type { ContractType, WorkMode } from '@vale/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { apiContractTypes, apiWorkModes } from '../profile.constants';

class WorkPreferencesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  areas?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(apiWorkModes.length)
  @ArrayUnique()
  @IsIn(apiWorkModes, { each: true })
  workModes?: WorkMode[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(apiContractTypes.length)
  @ArrayUnique()
  @IsIn(apiContractTypes, { each: true })
  contractTypes?: ContractType[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  availability?: string | null;
}

class CandidateExperienceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  organization!: string;

  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  startDate!: string;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  endDate?: string | null;

  @IsBoolean()
  current!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;
}

class CandidateEducationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  institution!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  course!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  level?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1940)
  @Max(2200)
  startYear?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1940)
  @Max(2200)
  endYear?: number | null;
}

export class UpdateCandidateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  pronouns?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  headline?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkPreferencesDto)
  workPreferences?: WorkPreferencesDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => CandidateExperienceDto)
  experiences?: CandidateExperienceDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => CandidateEducationDto)
  education?: CandidateEducationDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true },
  )
  @MaxLength(500, { each: true })
  professionalLinks?: string[];
}
