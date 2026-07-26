import Link from 'next/link';

import { JobsSearch } from '@/components/jobs-search';

export default function JobsPage() {
  return (
    <main className="app-shell">
      <header className="topbar" aria-label="Navegação de vagas">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Navegação pública">
          <Link href="/vagas">Vagas</Link>
          <Link href="/">Entrar ou criar conta</Link>
        </nav>
      </header>
      <JobsSearch />
    </main>
  );
}
