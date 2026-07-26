import Link from 'next/link';

import { ReportModerationQueue } from '@/components/report-moderation-queue';

export default function ReportsModerationPage() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Área da equipe">
          <Link href="/app/equipe/moderacao">Moderação de vagas</Link>
          <Link href="/app/equipe/denuncias">Denúncias</Link>
          <Link href="/app/equipe">Visão geral</Link>
        </nav>
      </header>
      <ReportModerationQueue />
    </main>
  );
}
