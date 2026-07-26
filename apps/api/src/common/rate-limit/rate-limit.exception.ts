import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export class RateLimitExceededException extends HttpException {
  constructor(readonly retryAfterSeconds: number) {
    super(
      {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Try again later.',
        retryAfterSeconds,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Catch(RateLimitExceededException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  catch(exception: RateLimitExceededException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader('Retry-After', exception.retryAfterSeconds);
    response.status(HttpStatus.TOO_MANY_REQUESTS).json(exception.getResponse());
  }
}
