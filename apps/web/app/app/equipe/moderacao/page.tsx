import Link from 'next/link';

import { ModerationQueue } from '@/components/moderation-queue';

export default function ModerationPage() {
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
      <ModerationQueue />
    </main>
  );
}
