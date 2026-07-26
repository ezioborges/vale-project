import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../common/auth/public.decorator';
import { HealthResponseDto } from './health.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  readyAlias(): Promise<HealthResponseDto> {
    return this.healthService.ready();
  }

  @Get('live')
  @ApiOkResponse({ type: HealthResponseDto })
  live(): HealthResponseDto {
    return this.healthService.live();
  }

  @Get('ready')
  @ApiOkResponse({ type: HealthResponseDto })
  ready(): Promise<HealthResponseDto> {
    return this.healthService.ready();
  }
}
