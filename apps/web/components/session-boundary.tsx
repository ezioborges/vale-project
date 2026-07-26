'use client';

import type { UserResponse, UserRole } from '@vale/shared';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { ApiRequestError, getCurrentUser } from '../lib/api';

type BoundaryState = 'checking' | 'ready' | 'action_required' | 'unavailable';

export function trustedRedirectFor(
  user: UserResponse,
  pathname: string,
): string | null {
  if (user.status !== 'active') {
    return pathname === user.initialPath ? null : user.initialPath;
  }

  const allowedPrefixes: Record<UserRole, string[]> = {
    admin: ['/admin', '/app/equipe'],
    coordinator: ['/app/equipe'],
    employer: ['/app/contratante'],
    candidate: ['/app/candidato'],
  };
  return allowedPrefixes[user.role].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
    ? null
    : user.initialPath;
}

export function SessionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<BoundaryState>('checking');

  useEffect(() => {
    let active = true;
    setState('checking');

    void getCurrentUser()
      .then((user) => {
        if (!active) return;
        const redirect = trustedRedirectFor(user, pathname);
        if (redirect) {
          router.replace(redirect);
          return;
        }
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiRequestError && error.code === 'FORBIDDEN') {
          setState('action_required');
          return;
        }
        setState('unavailable');
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (state === 'ready') return children;

  return (
    <main className="app-shell protected-area">
      <section className="content-band" aria-live="polite">
        <div className="section-heading">
          <span>Sessão protegida</span>
          <h1>
            {state === 'checking'
              ? 'Validando sua sessão'
              : state === 'action_required'
                ? 'Sua conta requer atenção'
                : 'Não foi possível validar a sessão'}
          </h1>
        </div>
        <p className="next-step">
          {state === 'checking'
            ? 'Aguarde enquanto confirmamos seu acesso.'
            : state === 'action_required'
              ? 'Revise o estado da conta ou os termos atuais antes de continuar.'
              : 'Volte à entrada e tente novamente.'}
        </p>
        {state === 'unavailable' ? (
          <Link className="secondary-action" href="/">
            Voltar à entrada
          </Link>
        ) : null}
      </section>
    </main>
  );
}
