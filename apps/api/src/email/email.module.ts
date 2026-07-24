import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '../common/config/env.validation';
import { EMAIL_SENDER } from './email-sender';
import { EmailService } from './email.service';
import { HttpEmailSender } from './http-email.sender';
import { LogEmailSender } from './log-email.sender';

@Module({
  providers: [
    EmailService,
    LogEmailSender,
    HttpEmailSender,
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService, LogEmailSender, HttpEmailSender],
      useFactory: (
        configService: ConfigService<Env, true>,
        logSender: LogEmailSender,
        httpSender: HttpEmailSender,
      ) =>
        configService.get('EMAIL_PROVIDER', { infer: true }) === 'http'
          ? httpSender
          : logSender,
    },
  ],
  exports: [EmailService, EMAIL_SENDER],
})
export class EmailModule {}
