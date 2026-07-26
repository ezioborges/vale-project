import type { UserRole, UserStatus } from '@vale/shared';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../jobs/dto/job.dto';
import { apiUserRoles, apiUserStatuses } from '../user.constants';

export class AdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(apiUserRoles)
  role?: UserRole;

  @IsOptional()
  @IsIn(apiUserStatuses)
  status?: UserStatus;
}
