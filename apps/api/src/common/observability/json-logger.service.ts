import { Injectable, LoggerService } from '@nestjs/common';

import { RequestContextService } from './request-context.service';

const sensitiveKey =
  /(authorization|cookie|csrf|password|token|secret|email|phone|name|address|bio|resume|message|description)/i;

@Injectable()
export class JsonLoggerService implements LoggerService {
  constructor(private readonly requestContext: RequestContextService) {}

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace ? { trace } : undefined);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  fatal(message: unknown, context?: string): void {
    this.write('fatal', message, context);
  }

  private write(
    level: string,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    const redactedExtra = this.redact(extra ?? {});
    const record = {
      timestamp: new Date().toISOString(),
      level,
      service: 'vale-api',
      requestId: this.requestContext.requestId,
      context,
      message: this.redact(message),
      ...(redactedExtra &&
      typeof redactedExtra === 'object' &&
      !Array.isArray(redactedExtra)
        ? redactedExtra
        : {}),
    };
    process.stdout.write(`${JSON.stringify(record)}\n`);
  }

  private redact(value: unknown, depth = 0): unknown {
    if (depth > 5) return '[truncated]';
    if (typeof value === 'string') return value.slice(0, 1000);
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value))
      return value.slice(0, 20).map((item) => this.redact(item, depth + 1));

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitiveKey.test(key) ? '[redacted]' : this.redact(item, depth + 1),
      ]),
    );
  }
}
