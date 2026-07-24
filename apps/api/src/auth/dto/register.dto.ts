import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '@vale/shared';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 12, maxLength: 128 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: ['candidate', 'employer'] })
  @IsIn(['candidate', 'employer'])
  role!: Extract<UserRole, 'candidate' | 'employer'>;

  @ApiProperty({ example: 'terms-2026-07-24' })
  @IsString()
  acceptedTermsVersion!: string;

  @ApiProperty({ example: 'privacy-2026-07-24' })
  @IsString()
  acceptedPrivacyVersion!: string;

  @ApiProperty({ example: 'guidelines-2026-07-24' })
  @IsString()
  acceptedGuidelinesVersion!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  acceptTerms!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  acceptPrivacy!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true)
  acceptGuidelines!: boolean;
}
