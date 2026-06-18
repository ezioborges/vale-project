import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '@vale/shared';
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['admin', 'coordinator', 'employer', 'candidate'] })
  @IsIn(['admin', 'coordinator', 'employer', 'candidate'])
  role!: UserRole;
}
