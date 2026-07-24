import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '../common/config/env.validation';
import { EmailMessage, EmailSender } from './email-sender';

@Injectable()
export class HttpEmailSender implements EmailSender {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  async send(message: EmailMessage): Promise<void> {
    const endpoint = this.configService.get('EMAIL_HTTP_ENDPOINT', {
      infer: true,
    });
    const token = this.configService.get('EMAIL_HTTP_TOKEN', { infer: true });

    if (!endpoint || !token) {
      throw new ServiceUnavailableException(
        'Remote email provider is not configured.',
      );
    }

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.configService.get('EMAIL_FROM', { infer: true }),
          ...message,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Remote email provider is unavailable.',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Remote email provider failed with status ${response.status}.`,
      );
    }
  }
}
