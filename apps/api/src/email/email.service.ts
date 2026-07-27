import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PublicRegistrationRole } from '@vale/shared';

import { Env } from '../common/config/env.validation';
import { EMAIL_SENDER, EmailMessage, EmailSender } from './email-sender';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService<Env, true>,
    @Inject(EMAIL_SENDER) private readonly sender: EmailSender,
  ) {}

  sendEmailVerification(input: {
    displayName: string;
    email: string;
    role: PublicRegistrationRole;
    token: string;
  }): Promise<void> {
    return this.send(this.emailVerificationMessage(input));
  }

  emailVerificationMessage(input: {
    displayName: string;
    email: string;
    role: PublicRegistrationRole;
    token: string;
  }): EmailMessage {
    const appUrl = this.configService.get('WEB_APP_URL', { infer: true });
    const onboarding =
      input.role === 'candidate'
        ? '/onboarding/candidato'
        : '/onboarding/contratante';
    const url = `${appUrl}${onboarding}?token=${encodeURIComponent(input.token)}`;

    return {
      to: input.email,
      subject: 'Confirme seu e-mail no Vale Project',
      text: `Olá, ${input.displayName}. Confirme seu e-mail acessando: ${url}`,
      html: `<p>Olá, ${this.escapeHtml(input.displayName)}.</p><p><a href="${this.escapeHtml(url)}">Confirme seu e-mail</a> para ativar sua conta.</p>`,
    };
  }

  sendPasswordReset(input: {
    displayName: string;
    email: string;
    token: string;
  }): Promise<void> {
    return this.send(this.passwordResetMessage(input));
  }

  sendOutboxMessage(
    messageType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (messageType === 'email') {
      const message = payload.message;
      if (
        !message ||
        typeof message !== 'object' ||
        Array.isArray(message) ||
        typeof (message as Record<string, unknown>).to !== 'string' ||
        typeof (message as Record<string, unknown>).subject !== 'string' ||
        typeof (message as Record<string, unknown>).text !== 'string' ||
        typeof (message as Record<string, unknown>).html !== 'string'
      ) {
        throw new Error('Invalid email outbox payload.');
      }
      return this.send(message as EmailMessage);
    }

    if (messageType === 'email_verification') {
      if (
        typeof payload.displayName !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string' ||
        typeof payload.token !== 'string' ||
        (payload.role !== 'candidate' && payload.role !== 'employer')
      ) {
        throw new Error('Invalid email verification outbox payload.');
      }
      return this.sendEmailVerification({
        displayName: payload.displayName,
        email: payload.email,
        role: payload.role,
        token: payload.token,
      });
    }

    if (messageType === 'password_reset') {
      if (
        typeof payload.displayName !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.token !== 'string'
      ) {
        throw new Error('Invalid password reset outbox payload.');
      }
      return this.sendPasswordReset({
        displayName: payload.displayName,
        email: payload.email,
        token: payload.token,
      });
    }

    throw new Error('Unsupported outbox message type.');
  }

  passwordResetMessage(input: {
    displayName: string;
    email: string;
    token: string;
  }): EmailMessage {
    const appUrl = this.configService.get('WEB_APP_URL', { infer: true });
    const url = `${appUrl}/recuperar-senha?token=${encodeURIComponent(input.token)}`;

    return {
      to: input.email,
      subject: 'Redefina sua senha do Vale Project',
      text: `Olá, ${input.displayName}. Redefina sua senha acessando: ${url}`,
      html: `<p>Olá, ${this.escapeHtml(input.displayName)}.</p><p><a href="${this.escapeHtml(url)}">Redefina sua senha</a>. Este link expira em poucos minutos e só pode ser usado uma vez.</p>`,
    };
  }

  send(message: EmailMessage): Promise<void> {
    return this.sender.send(message);
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character] ?? character,
    );
  }
}
