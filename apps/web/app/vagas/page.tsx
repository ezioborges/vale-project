import Link from 'next/link';

import { JobsSearch } from '@/components/jobs-search';
import { Brand } from '@/components/ui/brand';
import { ActionLink } from '@/components/ui/button';
import { Container, PageLayout } from '@/components/ui/layout';

export default function JobsPage() {
  return (
    <PageLayout>
      <header className="prismatic-header relative z-40 border-b border-vale-border">
        <span aria-hidden="true" className="primicias-pride-bar block h-0.5" />
        <Container
          className="flex min-h-18 flex-wrap items-center justify-between gap-3 py-3"
          size="wide"
        >
          <Link
            aria-label="Primícias — página inicial"
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
