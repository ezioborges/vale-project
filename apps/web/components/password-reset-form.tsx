'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ApiRequestError, resetPassword } from '@/lib/api';

import { Badge } from './ui/badge';
import { ActionLink, Button } from './ui/button';
import { Card } from './ui/card';
import { Alert } from './ui/feedback';
import { FormField, TextInput } from './ui/form-field';

type Feedback = {
  detail: string;
  tone: 'danger' | 'info';
  title: string;
};

function resetError(error: unknown): Feedback {
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

  return {
    detail: 'Solicite um novo link de recuperação e tente novamente.',
    title: 'Este link é inválido, expirou ou já foi utilizado',
    tone: 'danger',
  };
}

export function PasswordResetForm({ token }: { token?: string }) {
  const router = useRouter();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<Feedback>(
    token
      ? {
          detail: 'Defina uma senha nova com pelo menos 12 caracteres.',
          title: 'Escolha uma nova senha',
          tone: 'info',
        }
      : {
          detail: 'Solicite uma nova orientação de recuperação para continuar.',
          title: 'O link de recuperação está incompleto',
          tone: 'danger',
        },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (feedback.tone === 'danger') feedbackRef.current?.focus();
  }, [feedback]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    if (password !== passwordConfirmation) {
      setFieldError('As senhas precisam ser iguais.');
      setFeedback({
        detail: 'Revise os dois campos antes de salvar.',
        title: 'As senhas não coincidem',
        tone: 'danger',
      });
      return;
    }

    setFieldError(undefined);
    setIsSubmitting(true);
    try {
      await resetPassword({ token, password });
      router.replace('/?senha=alterada');
    } catch (error) {
      setFeedback(resetError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <Badge tone="accent">Segurança da conta</Badge>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] text-vale-ink sm:text-4xl">
        Redefinir senha
      </h1>
      <p className="mt-4 text-base leading-7 text-vale-muted">
        Ao salvar, as sessões anteriores serão encerradas para proteger sua
        conta.
      </p>

      <form className="mt-6 grid gap-5" onSubmit={submit}>
        <div ref={feedbackRef} tabIndex={-1}>
          <Alert title={feedback.title} tone={feedback.tone}>
            {feedback.detail}
          </Alert>
        </div>
        <FormField
          error={fieldError}
          hint="Use pelo menos 12 caracteres. Não registramos o valor informado."
          id="new-password"
          label="Nova senha"
          required
        >
          <TextInput
            autoComplete="new-password"
            maxLength={128}
            minLength={12}
            onChange={(event) => {
              setFieldError(undefined);
              setPassword(event.target.value);
            }}
            required
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
          />
        </FormField>
        <Button
          aria-pressed={isPasswordVisible}
          className="-mt-3 justify-self-start"
          onClick={() => setIsPasswordVisible((visible) => !visible)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
        </Button>
        <FormField
          error={fieldError}
          id="new-password-confirmation"
          label="Confirmar nova senha"
          required
        >
          <TextInput
            autoComplete="new-password"
            maxLength={128}
            minLength={12}
            onChange={(event) => {
              setFieldError(undefined);
              setPasswordConfirmation(event.target.value);
            }}
            required
            type={isPasswordVisible ? 'text' : 'password'}
            value={passwordConfirmation}
          />
        </FormField>
        <Button
          fullWidth
          loading={isSubmitting}
          loadingLabel="Salvando nova senha"
          type="submit"
        >
          Salvar nova senha
        </Button>
      </form>
      <ActionLink className="mt-5" href="/?acao=entrar#acesso" variant="ghost">
        Voltar à entrada
      </ActionLink>
    </Card>
  );
}
