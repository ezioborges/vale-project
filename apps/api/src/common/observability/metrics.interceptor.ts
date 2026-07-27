import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Request, Response } from 'express';

import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const routePath = request.route?.path;
        const route = routePath
          ? `${request.baseUrl}${routePath}`
          : '/unmatched';
        this.metrics.recordHttp(
          request.method,
          route,
          response.statusCode,
          performance.now() - start,
        );
      }),
    );
  }
}
