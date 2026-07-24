import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '@vale/shared';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['admin', 'coordinator', 'employer', 'candidate'] })
  @IsIn(['admin', 'coordinator', 'employer', 'candidate'])
  role!: UserRole;

  @ApiProperty({ minLength: 10, maxLength: 500 })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}
