'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { logoutUser } from '@/lib/api';

import { useSessionUser } from './session-boundary';
import { Badge } from './ui/badge';
import { Brand } from './ui/brand';
import { Button } from './ui/button';
import { Alert } from './ui/feedback';
import { Container, PageLayout } from './ui/layout';

type NavigationItem = {
  href: string;
  label: string;
};

const roleLabels = {
  admin: 'Administração',
  candidate: 'Pessoa candidata',
  coordinator: 'Coordenação',
  employer: 'Pessoa contratante',
} as const;

const navigationByRole: Record<
  keyof typeof roleLabels,
  readonly NavigationItem[]
> = {
  candidate: [
    { href: '/app/candidato', label: 'Meu perfil' },
    { href: '/vagas', label: 'Vagas' },
    { href: '/app/candidato/candidaturas', label: 'Candidaturas' },
    { href: '/app/candidato/denuncias', label: 'Denúncias' },
    { href: '/app/conta/privacidade', label: 'Privacidade' },
  ],
  employer: [
    { href: '/app/contratante', label: 'Perfil institucional' },
    { href: '/app/contratante/vagas', label: 'Vagas e candidaturas' },
    { href: '/app/contratante/denuncias', label: 'Denúncias' },
    { href: '/app/conta/privacidade', label: 'Privacidade' },
  ],
  coordinator: [
    { href: '/app/equipe', label: 'Visão geral' },
    { href: '/app/equipe/moderacao', label: 'Moderação de vagas' },
    { href: '/app/equipe/denuncias', label: 'Denúncias' },
  ],
  admin: [
    { href: '/admin', label: 'Administração' },
    { href: '/admin/usuarios', label: 'Usuários' },
    { href: '/admin/auditoria', label: 'Auditoria' },
    { href: '/app/equipe/denuncias', label: 'Denúncias' },
    { href: '/app/equipe/moderacao', label: 'Moderação de vagas' },
  ],
};

function isCurrentRoute(pathname: string, href: string) {
  return (
    pathname === href || (href !== '/app' && pathname.startsWith(`${href}/`))
  );
}

/** Navegação comum da área autenticada; autorização continua sob controle da API. */
export function AuthenticatedAppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const navigation = navigationByRole[user.role];

  async function signOut() {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await logoutUser();
      router.replace('/');
      router.refresh();
    } catch {
      setSignOutError(
        'Não foi possível encerrar a sessão agora. Tente novamente.',
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <PageLayout
      kind={user.role === 'admin' ? 'administrative' : 'authenticated'}
    >
      <header className="prismatic-header relative z-40 border-b border-vale-border">
        <span aria-hidden="true" className="primicias-pride-bar block h-0.5" />
        <Container
          className="flex min-h-18 flex-wrap items-center gap-x-6 gap-y-3 py-3"
          size="wide"
        >
          <Link
            aria-label="Primícias — área autenticada"
            href={user.initialPath}
          >
            <Brand />
          </Link>
          <nav
            aria-label="Navegação da área autenticada"
            className="order-3 flex w-full gap-1 overflow-x-auto pb-1 text-sm font-bold text-vale-muted lg:order-none lg:w-auto lg:flex-1 lg:pb-0"
          >
            {navigation.map((item) => (
              <Link
                aria-current={
                  isCurrentRoute(pathname, item.href) ? 'page' : undefined
                }
                className={`shrink-0 rounded-vale-sm px-3 py-2 transition hover:bg-vale-action-subtle hover:text-vale-action focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus ${
                  isCurrentRoute(pathname, item.href)
                    ? 'bg-vale-action-subtle text-vale-action'
                    : ''
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-extrabold text-vale-ink">
                {user.displayName}
              </p>
              <Badge tone="neutral">{roleLabels[user.role]}</Badge>
            </div>
            <Button
              loading={isSigningOut}
              loadingLabel="Encerrando sessão"
              onClick={signOut}
              size="sm"
              variant="secondary"
            >
              Sair
            </Button>
          </div>
        </Container>
      </header>
      <div className="py-8 sm:py-10">
        <Container size="wide">
          {signOutError ? (
            <Alert
              className="mb-6"
              title="A sessão continua ativa"
              tone="danger"
            >
              {signOutError}
            </Alert>
          ) : null}
          {children}
        </Container>
      </div>
    </PageLayout>
  );
}
