'use client';

import type { UserResponse, UserRole } from '@vale/shared';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { ApiRequestError, getCurrentUser } from '../lib/api';
import { ActionLink } from './ui/button';
import { Alert, LoadingState } from './ui/feedback';
import { Card } from './ui/card';
import { Container, PageLayout } from './ui/layout';
import { PageHeading } from './ui/page-heading';

type BoundaryState = 'checking' | 'ready' | 'action_required' | 'unavailable';

const SessionUserContext = createContext<UserResponse | null>(null);

export function useSessionUser(): UserResponse {
  const user = useContext(SessionUserContext);
  if (!user) {
    throw new Error(
      'A pessoa usuária deve estar disponível na sessão autenticada.',
    );
  }
  return user;
}

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
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    let active = true;
    setState('checking');
    setUser(null);

    void getCurrentUser()
      .then((user) => {
        if (!active) return;
        const redirect = trustedRedirectFor(user, pathname);
        if (redirect) {
          router.replace(redirect);
          return;
        }
        setUser(user);
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

  if (state === 'ready' && user) {
    return (
      <SessionUserContext.Provider value={user}>
        {children}
      </SessionUserContext.Provider>
    );
  }

  return (
    <PageLayout kind="authenticated">
      <div className="flex min-h-screen items-center py-10">
        <Container>
          <Card className="mx-auto w-full max-w-xl p-6 sm:p-8" role="status">
            {state === 'checking' ? (
              <LoadingState label="Validando sua sessão" />
            ) : (
              <>
                <PageHeading
                  as="h1"
                  description={
                    state === 'action_required'
                      ? 'Revise o estado da conta ou os documentos atuais antes de continuar.'
                      : 'Volte à entrada e tente novamente.'
                  }
                  eyebrow="Sessão protegida"
                  title={
                    state === 'action_required'
                      ? 'Sua conta requer atenção'
                      : 'Não foi possível validar a sessão'
                  }
                />
                <Alert
                  className="mt-6"
                  title="Conteúdo protegido"
                  tone="warning"
                >
                  Não exibimos dados da área autenticada antes de uma resposta
                  confiável da API.
                </Alert>
                <ActionLink className="mt-6" href="/" variant="secondary">
                  Voltar à entrada
                </ActionLink>
              </>
            )}
          </Card>
        </Container>
      </div>
    </PageLayout>
  );
}
