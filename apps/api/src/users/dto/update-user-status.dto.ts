import { ApiProperty } from '@nestjs/swagger';
import type { UserStatus } from '@vale/shared';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['active', 'suspended', 'disabled'] })
  @IsIn(['active', 'suspended', 'disabled'])
  status!: Exclude<UserStatus, 'pending_email'>;

  @ApiProperty({ minLength: 10, maxLength: 500 })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}
