import Link from 'next/link';
import type { ReactNode } from 'react';

import { Brand } from '@/components/ui/brand';
import { Container, PageLayout } from '@/components/ui/layout';

/** Cabeçalho enxuto e consistente para as jornadas antes da autenticação. */
export function PublicHeader() {
  return (
    <header className="border-b border-vale-border bg-vale-surface">
      <Container className="flex min-h-18 flex-wrap items-center justify-between gap-4 py-3">
        <Link aria-label="Vale — página inicial" href="/">
          <Brand />
        </Link>
        <nav
          aria-label="Navegação pública"
          className="flex items-center gap-1 text-sm font-bold text-vale-muted"
        >
          <Link
            className="rounded-vale-sm px-3 py-2 hover:text-vale-action focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus"
            href="/vagas"
          >
            Explorar vagas
          </Link>
          <Link
            className="rounded-vale-sm px-3 py-2 text-vale-action hover:bg-vale-action-subtle focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus"
            href="/?acao=entrar#acesso"
          >
            Entrar
          </Link>
        </nav>
      </Container>
    </header>
  );
}

export function PublicIdentityLayout({ children }: { children: ReactNode }) {
  return (
    <PageLayout kind="public">
      <PublicHeader />
      <div className="flex min-h-[calc(100vh-4.5rem)] items-center py-10 sm:py-16">
        <Container>
          <div className="mx-auto w-full max-w-xl">{children}</div>
        </Container>
      </div>
    </PageLayout>
  );
}
