import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PublicRegistrationRole } from '@vale/shared';

import { Env } from '../common/config/env.validation';
import { EMAIL_SENDER, EmailSender } from './email-sender';

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
    const appUrl = this.configService.get('WEB_APP_URL', { infer: true });
    const onboarding =
      input.role === 'candidate'
        ? '/onboarding/candidato'
        : '/onboarding/contratante';
    const url = `${appUrl}${onboarding}?token=${encodeURIComponent(input.token)}`;

    return this.sender.send({
      to: input.email,
      subject: 'Confirme seu e-mail no Vale Project',
      text: `Olá, ${input.displayName}. Confirme seu e-mail acessando: ${url}`,
      html: `<p>Olá, ${this.escapeHtml(input.displayName)}.</p><p><a href="${this.escapeHtml(url)}">Confirme seu e-mail</a> para ativar sua conta.</p>`,
    });
  }

  sendPasswordReset(input: {
    displayName: string;
    email: string;
    token: string;
  }): Promise<void> {
    const appUrl = this.configService.get('WEB_APP_URL', { infer: true });
    const url = `${appUrl}/recuperar-senha?token=${encodeURIComponent(input.token)}`;

    return this.sender.send({
      to: input.email,
      subject: 'Redefina sua senha do Vale Project',
      text: `Olá, ${input.displayName}. Redefina sua senha acessando: ${url}`,
      html: `<p>Olá, ${this.escapeHtml(input.displayName)}.</p><p><a href="${this.escapeHtml(url)}">Redefina sua senha</a>. Este link expira em poucos minutos e só pode ser usado uma vez.</p>`,
    });
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
