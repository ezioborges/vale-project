import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty()
  expiresInSeconds!: number;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
