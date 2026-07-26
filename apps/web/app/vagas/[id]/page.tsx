import Link from 'next/link';

import { JobDetail } from '@/components/job-detail';

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="app-shell">
      <header className="topbar" aria-label="Navegação da vaga">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Navegação pública">
          <Link href="/vagas">Todas as vagas</Link>
          <Link href="/">Minha conta</Link>
        </nav>
      </header>
      <JobDetail jobId={id} />
    </main>
  );
}
