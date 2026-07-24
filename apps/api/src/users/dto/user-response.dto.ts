import { ApiProperty } from '@nestjs/swagger';
import type { UserRole, UserStatus } from '@vale/shared';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

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

  @ApiProperty({
    description: 'Destino inicial adequado ao papel e estado da conta.',
  })
  initialPath!: string;
}
