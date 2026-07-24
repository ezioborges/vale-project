'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  refreshSession,
  requestEmailVerification,
  verifyEmail,
} from '@/lib/api';

type OnboardingVerificationProps = {
  token?: string;
  role: 'candidate' | 'employer';
};

export function OnboardingVerification({
  token,
  role,
}: OnboardingVerificationProps) {
  const router = useRouter();
  const [message, setMessage] = useState(
    token
      ? 'Seu link está pronto. Confirme para concluir esta etapa.'
      : 'Enviamos um link de confirmação para o e-mail do cadastro.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function confirmEmail() {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail(token);

      try {
        const session = await refreshSession();
        router.replace(session.user.initialPath);
      } catch {
        router.replace('/?email=verificado');
      }
    } catch {
      setMessage('Este link é inválido, expirou ou já foi utilizado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendEmail() {
    setIsSubmitting(true);
    try {
      await requestEmailVerification();
      setMessage('Um novo link foi enviado. O link anterior foi invalidado.');
    } catch {
      setMessage('Não foi possível reenviar agora. Aguarde e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="onboarding-card" aria-live="polite">
      <span className="eyebrow">
        Onboarding {role === 'candidate' ? 'de candidato' : 'de contratante'}
      </span>
      <h1>Confirme seu e-mail</h1>
      <p>
        {role === 'candidate'
          ? 'Depois da confirmação, você seguirá para sua área de oportunidades.'
          : 'Depois da confirmação, você seguirá para a área da organização e futuras vagas.'}
      </p>

      <div className="onboarding-actions">
        {token ? (
          <button
            className="primary-action"
            disabled={isSubmitting}
            onClick={confirmEmail}
            type="button"
          >
            Confirmar e continuar
          </button>
        ) : null}
        <button
          className="secondary-action"
          disabled={isSubmitting}
          onClick={resendEmail}
          type="button"
        >
          Reenviar e-mail
        </button>
      </div>
      <p className="auth-message">{message}</p>
    </section>
  );
}
