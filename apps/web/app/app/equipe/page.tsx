import Link from 'next/link';

export default function TeamHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Área da equipe">
          <Link href="/app/equipe/moderacao">Moderação de vagas</Link>
          <Link href="/app/equipe/denuncias">Denúncias</Link>
        </nav>
      </header>
      <section className="content-band">
        <div className="section-heading">
          <span>Coordenação</span>
          <h1>Área da equipe</h1>
        </div>
        <p className="next-step">
          Revise oportunidades antes da publicação e acompanhe decisões
          rastreáveis. A autorização continua sendo aplicada em cada ação pela
          API.
        </p>
        <div className="inline-actions">
          <Link className="primary-action" href="/app/equipe/moderacao">
            Moderar vagas
          </Link>
          <Link className="secondary-action" href="/app/equipe/denuncias">
            Analisar denúncias
          </Link>
        </div>
      </section>
    </main>
  );
}
