'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  ApiRequestError,
  refreshSession,
  requestEmailVerification,
  verifyEmail,
} from '@/lib/api';

import { Badge } from './ui/badge';
import { ActionLink, Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, Progress } from './ui/feedback';

type OnboardingVerificationProps = {
  token?: string;
  role: 'candidate' | 'employer';
};

type Feedback = {
  detail: string;
  title: string;
  tone: 'danger' | 'info' | 'success';
};

function verificationError(
  error: unknown,
  action: 'confirm' | 'resend',
): Feedback {
  if (error instanceof ApiRequestError && error.code === 'RATE_LIMITED') {
    return {
      detail: 'Aguarde alguns minutos antes de tentar novamente.',
      title: 'Muitas tentativas em pouco tempo',
      tone: 'danger',
    };
  }
  if (error instanceof ApiRequestError && error.code === 'NETWORK_ERROR') {
    return {
      detail: 'Verifique sua conexão e tente novamente.',
      title: 'Não foi possível alcançar o Vale',
      tone: 'danger',
    };
  }
  return action === 'confirm'
    ? {
        detail: 'Solicite um novo e-mail de confirmação para continuar.',
        title: 'Este link é inválido, expirou ou já foi utilizado',
        tone: 'danger',
      }
    : {
        detail: 'Tente novamente em alguns instantes.',
        title: 'Não foi possível reenviar o e-mail',
        tone: 'danger',
      };
}

export function OnboardingVerification({
  token,
  role,
}: OnboardingVerificationProps) {
  const router = useRouter();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<Feedback>(
    token
      ? {
          detail: 'Confirme para concluir esta etapa e seguir para sua área.',
          title: 'Seu link está pronto para confirmação',
          tone: 'info',
        }
      : {
          detail:
            'Abra o e-mail enviado no cadastro para concluir a confirmação.',
          title: 'Confira sua caixa de entrada',
          tone: 'info',
        },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (feedback.tone === 'danger') feedbackRef.current?.focus();
  }, [feedback]);

  useEffect(() => {
    if (resendCooldown === 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function confirmEmail() {
    if (!token) return;

    setIsSubmitting(true);
    try {
      await verifyEmail(token);

      try {
        const session = await refreshSession();
        router.replace(session.user.initialPath);
      } catch {
        router.replace('/?email=verificado');
      }
    } catch (error) {
      setFeedback(verificationError(error, 'confirm'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendEmail() {
    if (resendCooldown > 0) return;

    setIsSubmitting(true);
    try {
      await requestEmailVerification();
      setResendCooldown(60);
      setFeedback({
        detail:
          'O link anterior foi invalidado. Aguarde um minuto antes de solicitar outro.',
        title: 'Enviamos um novo e-mail de confirmação',
        tone: 'success',
      });
    } catch (error) {
      setFeedback(verificationError(error, 'resend'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const roleDescription =
    role === 'candidate'
      ? 'Depois da confirmação, você seguirá para sua área de oportunidades.'
      : 'Depois da confirmação, você seguirá para a área da organização e futuras vagas.';

  return (
    <Card className="p-6 sm:p-8">
      <Badge tone="accent">
        {role === 'candidate' ? 'Pessoa candidata' : 'Pessoa contratante'}
      </Badge>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] text-vale-ink sm:text-4xl">
        Confirme seu e-mail
      </h1>
      <p className="mt-4 text-base leading-7 text-vale-muted">
        {roleDescription}
      </p>
      <div className="mt-6 rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4">
        <Progress label="Progresso do onboarding" value={50} />
        <ol className="mt-4 grid gap-2 text-sm leading-6 text-vale-muted">
          <li>
            <strong className="text-vale-ink">1. Confirme seu e-mail</strong>{' '}
            — etapa atual.
          </li>
          <li>
            <strong className="text-vale-ink">2. Complete seu perfil</strong>{' '}
            — você poderá salvar e continuar depois.
          </li>
        </ol>
      </div>
      <div className="mt-6" ref={feedbackRef} tabIndex={-1}>
        <Alert title={feedback.title} tone={feedback.tone}>
          {feedback.detail}
        </Alert>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {token ? (
          <Button
            loading={isSubmitting}
            loadingLabel="Confirmando e-mail"
            onClick={confirmEmail}
          >
            Confirmar e continuar
          </Button>
        ) : null}
        <Button
          disabled={resendCooldown > 0}
          loading={isSubmitting}
          loadingLabel="Reenviando e-mail"
          onClick={resendEmail}
          variant="secondary"
        >
          {resendCooldown > 0
            ? `Reenviar em ${resendCooldown}s`
            : 'Reenviar e-mail'}
        </Button>
      </div>
      <ActionLink className="mt-5" href="/?acao=entrar#acesso" variant="ghost">
        Voltar à entrada
      </ActionLink>
    </Card>
  );
}
