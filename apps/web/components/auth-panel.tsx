'use client';

import { PublicRegistrationRole } from '@vale/shared';
import { FormEvent, useState } from 'react';

import { loginUser, registerUser, verifyEmail } from '@/lib/api';

type Mode = 'register' | 'login';

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>('register');
  const [role, setRole] = useState<PublicRegistrationRole>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [message, setMessage] = useState('Pronto para começar.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!acceptedTerms) {
          setMessage('É necessário aceitar os termos atuais para criar conta.');
          return;
        }

        const response = await registerUser({
          email,
          password,
          role,
          acceptedTermsVersion: 'mvp-2026-06-13',
          acceptTerms: true,
        });
        setVerificationToken(response.devEmailVerificationToken ?? '');
        setMessage(
          `Cadastro criado como ${response.user.role}. Confirme o e-mail para ações sensíveis.`,
        );
      } else {
        const response = await loginUser({ email, password });
        setMessage(`Sessão iniciada para ${response.user.email}.`);
      }
    } catch {
      setMessage('Não foi possível concluir a ação. Confira os dados.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await verifyEmail(verificationToken);
      setMessage(`E-mail confirmado. Status atual: ${user.status}.`);
    } catch {
      setMessage('Token de verificação inválido ou expirado.');
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
          <fieldset className="role-options">
            <legend>Fluxo</legend>
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

        <label>
          Senha
          <input
            autoComplete={
              mode === 'register' ? 'new-password' : 'current-password'
            }
            minLength={mode === 'register' ? 12 : 1}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {mode === 'register' ? (
          <label className="checkbox-row">
            <input
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              required
              type="checkbox"
            />
            Aceito os termos da versão mvp-2026-06-13.
          </label>
        ) : null}

        <button
          className="primary-action"
          disabled={isSubmitting}
          type="submit"
        >
          {mode === 'register' ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <form className="verification-form" onSubmit={submitVerification}>
        <label>
          Token de e-mail
          <input
            onChange={(event) => setVerificationToken(event.target.value)}
            placeholder="Disponível no provider fake em dev"
            type="text"
            value={verificationToken}
          />
        </label>
        <button disabled={!verificationToken || isSubmitting} type="submit">
          Confirmar e-mail
        </button>
      </form>

      <p className="auth-message">{message}</p>
    </div>
  );
}
