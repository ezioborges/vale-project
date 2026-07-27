import Link from 'next/link';

import { PrivacyCenter } from '@/components/privacy-center';

export default function PrivacyPage() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Área da conta">
          <Link href="/app/conta/privacidade">Privacidade</Link>
        </nav>
      </header>
      <PrivacyCenter />
    </main>
  );
}
