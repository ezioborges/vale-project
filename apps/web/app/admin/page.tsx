import Link from 'next/link';

export default function AdminHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar" aria-label="Navegação administrativa">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Áreas protegidas">
          <Link href="/admin/usuarios">Usuários</Link>
          <Link href="/admin/auditoria">Auditoria</Link>
          <Link href="/app/equipe/denuncias">Denúncias</Link>
          <Link href="/app/equipe/moderacao">Moderação de vagas</Link>
        </nav>
      </header>

      <section className="content-band">
        <div className="section-heading">
          <span>Governança</span>
          <h1>Administração e segurança</h1>
        </div>
        <p className="next-step">
          Gerencie acessos, acompanhe decisões sensíveis e consulte trilhas de
          auditoria sem expor o conteúdo privado dos relatos.
        </p>
        <div className="admin-home-grid">
          <Link className="admin-home-card" href="/admin/usuarios">
            <span>01</span>
            <strong>Usuários e acessos</strong>
            <p>Altere papéis e estados com motivo obrigatório.</p>
          </Link>
          <Link className="admin-home-card" href="/app/equipe/denuncias">
            <span>02</span>
            <strong>Fila de denúncias</strong>
            <p>Priorize relatos e registre cada decisão de moderação.</p>
          </Link>
          <Link className="admin-home-card" href="/admin/auditoria">
            <span>03</span>
            <strong>Auditoria</strong>
            <p>Investigue eventos administrativos por ação e período.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
