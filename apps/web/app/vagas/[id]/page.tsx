import Link from 'next/link';

import { JobDetail } from '@/components/job-detail';
import { Brand } from '@/components/ui/brand';
import { ActionLink } from '@/components/ui/button';
import { Container, PageLayout } from '@/components/ui/layout';

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageLayout>
      <header className="border-b border-vale-border bg-vale-surface">
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
              Todas as vagas
            </ActionLink>
            <ActionLink href="/" size="sm" variant="secondary">
              Minha conta
            </ActionLink>
          </nav>
        </Container>
      </header>
      <JobDetail jobId={id} />
    </PageLayout>
  );
}
