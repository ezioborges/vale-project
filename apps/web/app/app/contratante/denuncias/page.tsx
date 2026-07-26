import Link from 'next/link';

import { MyReports } from '@/components/my-reports';

export default function EmployerReportsPage() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Área do contratante">
          <Link href="/app/contratante/vagas">Vagas e candidaturas</Link>
          <Link href="/app/contratante/denuncias">Denúncias</Link>
          <Link href="/app/contratante">Perfil institucional</Link>
        </nav>
      </header>
      <MyReports />
    </main>
  );
}
