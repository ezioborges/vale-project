import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/roles.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('observability')
@ApiBearerAuth()
@Controller('internal/metrics')
export class ObservabilityController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Roles('admin')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metricsEndpoint(): string {
    return this.metrics.renderPrometheus();
  }
}
