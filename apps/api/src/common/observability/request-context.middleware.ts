import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

import { RequestContextService } from './request-context.service';

const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header('x-request-id');
    const requestId =
      incoming && requestIdPattern.test(incoming) ? incoming : randomUUID();
    response.setHeader('X-Request-ID', requestId);
    this.requestContext.run({ requestId }, next);
  }
}
