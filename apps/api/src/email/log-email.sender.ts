import { Injectable, Logger } from '@nestjs/common';

import { EmailMessage, EmailSender } from './email-sender';

@Injectable()
export class LogEmailSender implements EmailSender {
  private readonly logger = new Logger(LogEmailSender.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      JSON.stringify({
        provider: 'log',
        to: message.to,
        subject: message.subject,
        text: message.text,
      }),
    );
  }
}
