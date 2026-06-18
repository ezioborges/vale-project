import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Fallback para clientes sem cookie HttpOnly.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
