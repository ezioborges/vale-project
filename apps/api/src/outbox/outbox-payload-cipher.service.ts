import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '../common/config/env.validation';

type EncryptedPayload = {
  iv: string;
  ciphertext: string;
  tag: string;
};

@Injectable()
export class OutboxPayloadCipherService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  encrypt(payload: Record<string, unknown>): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    const encrypted: EncryptedPayload = {
      iv: iv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    };
    return JSON.stringify(encrypted);
  }

  decrypt(payload: string): Record<string, unknown> {
    let encrypted: EncryptedPayload;
    try {
      encrypted = JSON.parse(payload) as EncryptedPayload;
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key(),
        Buffer.from(encrypted.iv, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');
      const decoded = JSON.parse(plaintext) as unknown;
      if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
        throw new Error('Invalid outbox payload.');
      }
      return decoded as Record<string, unknown>;
    } catch {
      throw new Error('Outbox payload cannot be decrypted.');
    }
  }

  private key(): Buffer {
    const key = Buffer.from(
      this.configService.get('OUTBOX_ENCRYPTION_KEY', { infer: true }),
      'base64',
    );
    if (key.length !== 32) {
      throw new Error('Outbox encryption key is invalid.');
    }
    return key;
  }
}
