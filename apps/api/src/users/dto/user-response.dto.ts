import { ApiProperty } from '@nestjs/swagger';
import type { UserRole, UserStatus } from '@vale/shared';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ['admin', 'coordinator', 'employer', 'candidate'] })
  role!: UserRole;

  @ApiProperty({
    enum: ['pending_email', 'active', 'suspended', 'disabled'],
  })
  status!: UserStatus;

  @ApiProperty({ nullable: true })
  emailVerifiedAt!: string | null;
}
