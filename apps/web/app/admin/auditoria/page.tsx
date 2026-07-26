import Link from 'next/link';

import { AuditBrowser } from '@/components/audit-browser';

export default function AdminAuditPage() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar" aria-label="Navegação administrativa">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links">
          <Link href="/admin">Visão geral</Link>
          <Link href="/admin/usuarios">Usuários</Link>
          <Link href="/admin/auditoria">Auditoria</Link>
          <Link href="/app/equipe/denuncias">Denúncias</Link>
        </nav>
      </header>
      <AuditBrowser />
    </main>
  );
}
