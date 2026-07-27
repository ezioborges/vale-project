import Link from 'next/link';

import { JobsSearch } from '@/components/jobs-search';
import { Brand } from '@/components/ui/brand';
import { ActionLink } from '@/components/ui/button';
import { Container, PageLayout } from '@/components/ui/layout';

export default function JobsPage() {
  return (
    <PageLayout>
      <header className="border-b border-vale-border bg-vale-surface">
        <Container
          className="flex min-h-18 flex-wrap items-center justify-between gap-3 py-3"
          size="wide"
        >
          <Link
            aria-label="Vale — página inicial"
            className="rounded-vale-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus"
            href="/"
          >
            <Brand />
          </Link>
          <nav
            aria-label="Navegação pública"
            className="flex items-center gap-2"
          >
            <ActionLink href="/vagas" size="sm" variant="ghost">
              Vagas
            </ActionLink>
            <ActionLink href="/" size="sm" variant="secondary">
              Entrar ou criar conta
            </ActionLink>
          </nav>
        </Container>
      </header>
      <JobsSearch />
    </PageLayout>
  );
}
