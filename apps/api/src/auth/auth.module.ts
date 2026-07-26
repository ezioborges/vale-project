import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Env } from '../common/config/env.validation';
import { CsrfService } from '../common/auth/csrf.service';
import { EmailModule } from '../email/email.module';
import { TermsModule } from '../terms/terms.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationToken } from './email-verification-token.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { RefreshToken } from './refresh-token.entity';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    TermsModule,
    EmailModule,
    TypeOrmModule.forFeature([
      RefreshToken,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        secret: configService.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          audience: configService.get('JWT_AUDIENCE', { infer: true }),
          issuer: configService.get('JWT_ISSUER', { infer: true }),
        },
        verifyOptions: {
          algorithms: ['HS256'],
          audience: configService.get('JWT_AUDIENCE', { infer: true }),
          issuer: configService.get('JWT_ISSUER', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CsrfService],
  exports: [AuthService, CsrfService, JwtModule],
})
export class AuthModule {}
