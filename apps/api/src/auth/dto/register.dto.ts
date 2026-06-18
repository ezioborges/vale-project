import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '@vale/shared';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  password!: string;

  @ApiProperty({ enum: ['candidate', 'employer'] })
  @IsIn(['candidate', 'employer'])
  role!: Extract<UserRole, 'candidate' | 'employer'>;

  @ApiProperty({ example: 'mvp-2026-06-13' })
  @IsString()
  acceptedTermsVersion!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  acceptTerms!: boolean;
}
