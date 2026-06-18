import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'vale-api' })
  app!: 'vale-api';

  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status!: 'ok' | 'error';

  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  database!: 'ok' | 'error';

  @ApiProperty({ example: '2026-06-13T12:00:00.000Z' })
  timestamp!: string;
}
