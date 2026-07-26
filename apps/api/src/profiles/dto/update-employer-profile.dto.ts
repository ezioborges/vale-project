import type { EmployerProfileType } from '@vale/shared';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { apiEmployerProfileTypes } from '../profile.constants';

export class UpdateEmployerProfileDto {
  @IsOptional()
  @IsIn(apiEmployerProfileTypes)
  type?: EmployerProfileType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  responsibleName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  organizationName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  segment?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  website?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string | null;
}
