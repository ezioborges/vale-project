import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { JsonLoggerService } from './json-logger.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';
import { ObservabilityController } from './observability.controller';
import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from './request-context.service';

@Module({
  controllers: [ObservabilityController],
  providers: [
    JsonLoggerService,
    MetricsInterceptor,
    MetricsService,
    RequestContextMiddleware,
    RequestContextService,
  ],
  exports: [
    JsonLoggerService,
    MetricsInterceptor,
    MetricsService,
    RequestContextService,
  ],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
