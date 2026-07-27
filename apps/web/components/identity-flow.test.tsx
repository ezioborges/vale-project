import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { AuthPanel } from './auth-panel';
import { OnboardingVerification } from './onboarding-verification';
import { PasswordResetForm } from './password-reset-form';

describe('jornada de identidade', () => {
  it('mantém escolha de papel, consentimentos independentes e campos associados no cadastro', () => {
    const markup = renderToStaticMarkup(<AuthPanel />);

    expect(markup).toContain('Pessoa candidata');
    expect(markup).toContain('Pessoa contratante');
    expect(markup.match(/type="checkbox"/g)).toHaveLength(3);
    expect(markup).toContain('for="email"');
    expect(markup).toContain('aria-describedby="email-hint"');
    expect(markup).toContain('Mostrar senha');
  });

  it('expõe os estados seguros de redefinição e confirmação de e-mail', () => {
    const resetMarkup = renderToStaticMarkup(<PasswordResetForm token="abc" />);
    const verificationMarkup = renderToStaticMarkup(
      <OnboardingVerification role="candidate" token="abc" />,
    );

    expect(resetMarkup).toContain('for="new-password"');
    expect(resetMarkup).toContain('for="new-password-confirmation"');
    expect(resetMarkup).toContain('Salvar nova senha');
    expect(verificationMarkup).toContain('Confirmar e continuar');
    expect(verificationMarkup).toContain('Reenviar e-mail');
    expect(verificationMarkup).toContain('Progresso do onboarding');
    expect(verificationMarkup).toContain('Complete seu perfil');
  });
});
