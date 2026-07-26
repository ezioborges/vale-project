import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { Env } from '../config/env.validation';

@Injectable()
export class CsrfService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  issueToken(): string {
    const nonce = randomBytes(32).toString('base64url');
    return `${nonce}.${this.signatureFor(nonce)}`;
  }

  isValid(token: string): boolean {
    const [nonce, suppliedSignature, extra] = token.split('.');
    if (!nonce || !suppliedSignature || extra) {
      return false;
    }

    const expectedSignature = this.signatureFor(nonce);
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);

    return (
      supplied.length === expected.length && timingSafeEqual(supplied, expected)
    );
  }

  tokensMatch(cookieToken: string, headerToken: string): boolean {
    const cookie = Buffer.from(cookieToken);
    const header = Buffer.from(headerToken);
    return (
      cookie.length === header.length &&
      timingSafeEqual(cookie, header) &&
      this.isValid(cookieToken)
    );
  }

  private signatureFor(nonce: string): string {
    return createHmac(
      'sha256',
      this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
    )
      .update(`vale-csrf:v1:${nonce}`)
      .digest('base64url');
  }
}
