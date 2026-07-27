import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { EmailVerifiedGuard } from './common/auth/email-verified.guard';
import { CsrfGuard } from './common/auth/csrf.guard';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { TermsGuard } from './common/auth/terms.guard';
import { envSchema } from './common/config/env.validation';
import { RateLimitGuard } from './common/rate-limit/rate-limit.guard';
import { RateLimitExceptionFilter } from './common/rate-limit/rate-limit.exception';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { MetricsInterceptor } from './common/observability/metrics.interceptor';
import { ObservabilityModule } from './common/observability/observability.module';
import { getTypeOrmOptions } from './database/typeorm.config';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { OutboxModule } from './outbox/outbox.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PrivacyModule } from './privacy/privacy.module';
import { ReportsModule } from './reports/reports.module';
import { TermsModule } from './terms/terms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: getTypeOrmOptions,
    }),
    AuditModule,
    ObservabilityModule,
    RateLimitModule,
    TermsModule,
    UsersModule,
    AuthModule,
    OutboxModule,
    ProfilesModule,
    PrivacyModule,
    JobsModule,
    ReportsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: RateLimitExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TermsGuard },
    { provide: APP_GUARD, useClass: EmailVerifiedGuard },
  ],
})
export class AppModule {}
