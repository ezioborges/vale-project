'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { resetPassword } from '@/lib/api';

export function PasswordResetForm({ token }: { token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(
    token
      ? 'Defina uma nova senha com pelo menos 12 caracteres.'
      : 'O link de recuperação está incompleto.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, password });
      router.replace('/?senha=alterada');
    } catch {
      setMessage('O link é inválido, expirou ou já foi utilizado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="onboarding-card" onSubmit={submit}>
      <span className="eyebrow">Segurança da conta</span>
      <h1>Redefinir senha</h1>
      <label>
        Nova senha
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <button
        className="primary-action"
        disabled={!token || isSubmitting}
        type="submit"
      >
        Salvar nova senha
      </button>
      <p className="auth-message">{message}</p>
    </form>
  );
}
