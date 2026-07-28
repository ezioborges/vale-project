'use client';

import { PublicRegistrationRole } from '@vale/shared';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  ApiRequestError,
  forgotPassword,
  getRegistrationConfig,
  loginUser,
  registerUser,
} from '@/lib/api';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert } from './ui/feedback';
import {
  CheckboxField,
  FormField,
  RadioCard,
  TextInput,
} from './ui/form-field';

type Mode = 'register' | 'login' | 'forgot';
type InitialMode = Exclude<Mode, 'forgot'>;
type Feedback = {
  detail: string;
  title: string;
  tone: 'danger' | 'info' | 'success';
};
type FieldName = 'displayName' | 'email' | 'password';

const fallbackVersions = {
  terms: 'terms-2026-07-24',
  privacy: 'privacy-2026-07-24',
  guidelines: 'guidelines-2026-07-24',
};

function authErrorFeedback(error: unknown, action: Mode): Feedback {
  if (error instanceof ApiRequestError) {
    if (error.code === 'RATE_LIMITED') {
      return {
        detail: 'Aguarde alguns minutos antes de tentar novamente.',
        title: 'Muitas tentativas em pouco tempo',
        tone: 'danger',
      };
    }

    if (error.code === 'NETWORK_ERROR') {
      return {
        detail: 'Verifique sua conexão e tente novamente.',
        title: 'Não foi possível alcançar Primícias',
        tone: 'danger',
      };
    }

    if (action === 'login' && error.code === 'UNAUTHORIZED') {
      return {
        detail: 'Confira os dados informados ou recupere sua senha.',
        title: 'Não foi possível entrar com esses dados',
        tone: 'danger',
      };
    }

    if (action === 'register' && error.code === 'CONFLICT') {
      return {
        detail: 'Use outro endereço ou entre com a conta que já existe.',
        title: 'Este e-mail já está em uso',
        tone: 'danger',
      };
    }
  }

  return {
    detail:
      action === 'forgot'
        ? 'Tente novamente em instantes. Por segurança, não informamos se um e-mail possui conta.'
        : 'Revise as informações e tente novamente.',
    title: 'Não foi possível concluir esta ação',
    tone: 'danger',
  };
}

export function AuthPanel({
  initialMode = 'register',
  initialNotice,
}: {
  initialMode?: InitialMode;
  initialNotice?: Feedback;
}) {
  const router = useRouter();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<PublicRegistrationRole>('candidate');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [versions, setVersions] = useState(fallbackVersions);
  const [isRegistrationConfigReady, setIsRegistrationConfigReady] =
    useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(
    initialNotice ?? null,
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getRegistrationConfig()
      .then((config) => {
        setVersions(config.legalDocuments);
        setIsRegistrationConfigReady(true);
      })
      .catch(() => {
        setFeedback({
          detail: 'Tente recarregar a página para consultar as versões atuais.',
          title: 'Não foi possível carregar os documentos do cadastro',
          tone: 'danger',
        });
      });
  }, []);

  useEffect(() => {
    if (feedback?.tone === 'danger') feedbackRef.current?.focus();
  }, [feedback]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setFieldErrors({});
    setFeedback(null);
  }

  function clearFieldError(field: FieldName) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    if (mode === 'register' && !isRegistrationConfigReady) {
      setFeedback({
        detail:
          'Aguarde o carregamento ou recarregue a página antes de continuar.',
        title: 'Os documentos do cadastro ainda não estão disponíveis',
        tone: 'danger',
      });
      return;
    }

    if (
      mode === 'register' &&
      (!acceptedTerms || !acceptedPrivacy || !acceptedGuidelines)
    ) {
      setFeedback({
        detail:
          'Os documentos obrigatórios precisam ser aceitos separadamente para criar a conta.',
        title: 'Revise os consentimentos',
        tone: 'danger',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const response = await registerUser({
          displayName,
          email,
          password,
          role,
          acceptedTermsVersion: versions.terms,
          acceptedPrivacyVersion: versions.privacy,
          acceptedGuidelinesVersion: versions.guidelines,
          acceptTerms: true,
          acceptPrivacy: true,
          acceptGuidelines: true,
        });
        router.push(response.user.initialPath);
        return;
      }

      if (mode === 'forgot') {
        await forgotPassword({ email });
        setFeedback({
          detail:
            'Se o endereço estiver cadastrado, você receberá um link de uso único. Verifique também a caixa de spam.',
          title: 'Confira seu e-mail',
          tone: 'success',
        });
        return;
      }

      const response = await loginUser({ email, password });
      router.push(response.user.initialPath);
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'BAD_REQUEST') {
        setFieldErrors({
          ...(mode === 'register'
            ? { displayName: 'Revise o nome informado.' }
            : {}),
          email: 'Revise o e-mail informado.',
          ...(mode !== 'forgot'
            ? { password: 'Revise os requisitos da senha.' }
            : {}),
        });
      }
      setFeedback(authErrorFeedback(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegistering = mode === 'register';
  const isForgotPassword = mode === 'forgot';

  return (
    <Card className="p-5 sm:p-7" id="acesso">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="accent">
            {isRegistering
              ? 'Criar conta'
              : isForgotPassword
                ? 'Recuperar acesso'
                : 'Acessar conta'}
          </Badge>
          <h2
            className="mt-4 text-2xl font-black tracking-[-0.04em] text-vale-ink"
            id="auth-panel-title"
          >
            {isRegistering
              ? 'Seu próximo passo começa aqui'
              : isForgotPassword
                ? 'Vamos ajudar você a entrar novamente'
                : 'Que bom ter você de volta'}
          </h2>
        </div>
      </div>

      {!isForgotPassword ? (
        <div
          aria-label="Escolha entre cadastro e login"
          className="mt-6 grid grid-cols-2 rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-1"
        >
          <button
            aria-pressed={isRegistering}
            className={`min-h-11 rounded-vale-sm border-0 px-3 text-sm font-extrabold transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus ${
              isRegistering
                ? 'bg-vale-surface text-vale-ink shadow-sm'
                : 'text-vale-muted hover:text-vale-action'
            }`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Cadastro
          </button>
          <button
            aria-pressed={mode === 'login'}
            className={`min-h-11 rounded-vale-sm border-0 px-3 text-sm font-extrabold transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus ${
              mode === 'login'
                ? 'bg-vale-surface text-vale-ink shadow-sm'
                : 'text-vale-muted hover:text-vale-action'
            }`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Entrar
          </button>
        </div>
      ) : null}

      <form
        aria-labelledby="auth-panel-title"
        className="mt-6 grid gap-5"
        onSubmit={submitAuth}
      >
        {feedback ? (
          <div ref={feedbackRef} tabIndex={-1}>
            <Alert title={feedback.title} tone={feedback.tone}>
              {feedback.detail}
            </Alert>
          </div>
        ) : null}

        {isRegistering ? (
          <fieldset className="m-0 grid gap-3 border-0 p-0">
            <legend className="px-0 text-sm font-extrabold text-vale-ink">
              Como você quer usar Primícias?
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <RadioCard
                checked={role === 'candidate'}
                description="Encontre oportunidades e acompanhe candidaturas."
                name="role"
                onChange={() => setRole('candidate')}
                value="candidate"
                label="Pessoa candidata"
              />
              <RadioCard
                checked={role === 'employer'}
                description="Publique oportunidades e conheça pessoas candidatas."
                name="role"
                onChange={() => setRole('employer')}
                value="employer"
                label="Pessoa contratante"
              />
            </div>
          </fieldset>
        ) : null}

        {isRegistering ? (
          <FormField
            error={fieldErrors.displayName}
            hint="Como você quer ser chamada nesta conta."
            id="display-name"
            label="Nome"
            required
          >
            <TextInput
              autoComplete="name"
              maxLength={120}
              minLength={2}
              onChange={(event) => {
                clearFieldError('displayName');
                setDisplayName(event.target.value);
              }}
              required
              type="text"
              value={displayName}
            />
          </FormField>
        ) : null}

        <FormField
          error={fieldErrors.email}
          hint={
            isForgotPassword
              ? 'Enviaremos uma orientação sem confirmar se existe uma conta neste endereço.'
              : 'Usaremos este endereço para acessar e confirmar sua conta.'
          }
          id="email"
          label="E-mail"
          required
        >
          <TextInput
            autoComplete="email"
            onChange={(event) => {
              clearFieldError('email');
              setEmail(event.target.value);
            }}
            required
            type="email"
            value={email}
          />
        </FormField>

        {!isForgotPassword ? (
          <>
            <FormField
              error={fieldErrors.password}
              hint={
                isRegistering
                  ? 'Use pelo menos 12 caracteres. Não registramos o valor informado.'
                  : undefined
              }
              id="password"
              label="Senha"
              required
            >
              <TextInput
                autoComplete={
                  isRegistering ? 'new-password' : 'current-password'
                }
                maxLength={128}
                minLength={isRegistering ? 12 : 1}
                onChange={(event) => {
                  clearFieldError('password');
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
          </>
        ) : null}

        {isRegistering ? (
          <fieldset className="m-0 grid gap-4 border-x-0 border-b-0 border-t border-vale-border p-0 pt-5">
            <legend className="px-0 text-sm font-extrabold text-vale-ink">
              Consentimentos obrigatórios
            </legend>
            <p className="-mt-2 text-sm leading-6 text-vale-muted">
              Cada aceite é registrado com a versão vigente do respectivo
              documento.
            </p>
            <CheckboxField
              checked={acceptedTerms}
              label={`Aceito os termos de uso (${versions.terms}).`}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              required
            />
            <CheckboxField
              checked={acceptedPrivacy}
              label={`Aceito a política de privacidade (${versions.privacy}).`}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
              required
            />
            <CheckboxField
              checked={acceptedGuidelines}
              label={`Aceito as diretrizes de inclusão (${versions.guidelines}).`}
              onChange={(event) => setAcceptedGuidelines(event.target.checked)}
              required
            />
          </fieldset>
        ) : null}

        <Button
          fullWidth
          loading={isSubmitting}
          loadingLabel={
            isRegistering
              ? 'Criando conta'
              : isForgotPassword
                ? 'Enviando orientação'
                : 'Entrando na conta'
          }
          disabled={isRegistering && !isRegistrationConfigReady}
          type="submit"
        >
          {isRegistering
            ? 'Criar conta'
            : isForgotPassword
              ? 'Enviar orientação'
              : 'Entrar'}
        </Button>
      </form>

      {mode === 'login' ? (
        <Button
          className="mt-4"
          onClick={() => switchMode('forgot')}
          size="sm"
          variant="ghost"
        >
          Esqueci minha senha
        </Button>
      ) : null}
      {isForgotPassword ? (
        <Button
          className="mt-4"
          onClick={() => switchMode('login')}
          size="sm"
          variant="ghost"
        >
          Voltar ao login
        </Button>
      ) : null}
    </Card>
  );
}
