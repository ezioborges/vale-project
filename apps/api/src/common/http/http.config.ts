import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';

import { Env } from '../config/env.validation';

export function configureHttpApp(
  app: NestExpressApplication,
  config: ConfigService<Env, true>,
): void {
  const trustProxyHops = config.get('TRUST_PROXY_HOPS', { infer: true });
  const allowedOrigin = new URL(config.get('API_CORS_ORIGIN', { infer: true }))
    .origin;
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  app.use(cookieParser());
  app.use(securityHeaders);
  app.enableCors({
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'Idempotency-Key',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
    credentials: true,
    exposedHeaders: [
      'Content-Disposition',
      'Idempotency-Replayed',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: (origin, callback) =>
      callback(null, origin === undefined || origin === allowedOrigin),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

function securityHeaders(
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.setHeader(
    'Content-Security-Policy-Report-Only',
    [
      "default-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
    ].join('; '),
  );
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  );
  next();
}
