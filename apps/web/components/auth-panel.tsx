'use client';

import { PublicRegistrationRole } from '@vale/shared';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  forgotPassword,
  getRegistrationConfig,
  loginUser,
  registerUser,
} from '@/lib/api';

type Mode = 'register' | 'login' | 'forgot';

const fallbackVersions = {
  terms: 'terms-2026-07-24',
  privacy: 'privacy-2026-07-24',
  guidelines: 'guidelines-2026-07-24',
};

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('register');
  const [role, setRole] = useState<PublicRegistrationRole>('candidate');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [versions, setVersions] = useState(fallbackVersions);
  const [isRegistrationConfigReady, setIsRegistrationConfigReady] =
    useState(false);
  const [message, setMessage] = useState('Pronto para começar.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getRegistrationConfig()
      .then((config) => {
        setVersions(config.legalDocuments);
        setIsRegistrationConfigReady(true);
      })
      .catch(() => {
        setMessage(
          'Não foi possível carregar as versões legais atuais. Tente novamente.',
        );
      });
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!isRegistrationConfigReady) {
          setMessage('Aguarde o carregamento dos documentos atuais.');
          return;
        }

        if (!acceptedTerms || !acceptedPrivacy || !acceptedGuidelines) {
          setMessage('Os três documentos obrigatórios precisam ser aceitos.');
          return;
        }

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
        setMessage(
          'Se o e-mail estiver cadastrado, você receberá um link de uso único.',
        );
        return;
      }

      const response = await loginUser({ email, password });
      router.push(response.user.initialPath);
    } catch {
      setMessage('Não foi possível concluir a ação. Confira os dados.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-panel" aria-live="polite">
      <div
        className="segmented-control"
        role="tablist"
        aria-label="Autenticação"
      >
        <button
          aria-selected={mode === 'register'}
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
          role="tab"
          type="button"
        >
          Cadastro
        </button>
        <button
          aria-selected={mode === 'login'}
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
          role="tab"
          type="button"
        >
          Login
        </button>
      </div>

      <form className="auth-form" onSubmit={submitAuth}>
        {mode === 'register' ? (
          <>
            <fieldset className="role-options">
              <legend>Quero usar o Vale como</legend>
              <label>
                <input
                  checked={role === 'candidate'}
                  name="role"
                  onChange={() => setRole('candidate')}
                  type="radio"
                />
                Candidato
              </label>
              <label>
                <input
                  checked={role === 'employer'}
                  name="role"
                  onChange={() => setRole('employer')}
                  type="radio"
                />
                Contratante
              </label>
            </fieldset>

            <label>
              Nome
              <input
                autoComplete="name"
                maxLength={120}
                minLength={2}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                type="text"
                value={displayName}
              />
            </label>
          </>
        ) : null}

        <label>
          E-mail
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        {mode !== 'forgot' ? (
          <label>
            Senha
            <input
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
              minLength={mode === 'register' ? 12 : 1}
              maxLength={128}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
        ) : null}

        {mode === 'register' ? (
          <div className="consent-list">
            <label className="checkbox-row">
              <input
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                required
                type="checkbox"
              />
              Aceito os termos de uso ({versions.terms}).
            </label>
            <label className="checkbox-row">
              <input
                checked={acceptedPrivacy}
                onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                required
                type="checkbox"
              />
              Aceito a política de privacidade ({versions.privacy}).
            </label>
            <label className="checkbox-row">
              <input
                checked={acceptedGuidelines}
                onChange={(event) =>
                  setAcceptedGuidelines(event.target.checked)
                }
                required
                type="checkbox"
              />
              Aceito as diretrizes de inclusão ({versions.guidelines}).
            </label>
          </div>
        ) : null}

        <button
          className="primary-action"
          disabled={
            isSubmitting || (mode === 'register' && !isRegistrationConfigReady)
          }
          type="submit"
        >
          {mode === 'register'
            ? 'Criar conta'
            : mode === 'forgot'
              ? 'Enviar link'
              : 'Entrar'}
        </button>
      </form>

      {mode === 'login' ? (
        <button
          className="text-action"
          onClick={() => setMode('forgot')}
          type="button"
        >
          Esqueci minha senha
        </button>
      ) : null}
      {mode === 'forgot' ? (
        <button
          className="text-action"
          onClick={() => setMode('login')}
          type="button"
        >
          Voltar ao login
        </button>
      ) : null}

      <p className="auth-message">{message}</p>
    </div>
  );
}
