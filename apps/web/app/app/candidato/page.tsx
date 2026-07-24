import Link from 'next/link';

export default function CandidateHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Área do candidato">
          <Link href="/app/candidato">Minha jornada</Link>
        </nav>
      </header>
      <section className="content-band">
        <div className="section-heading">
          <span>Candidato</span>
          <h1>Sua área de oportunidades</h1>
        </div>
        <p className="next-step">
          Identidade, consentimentos e e-mail estão prontos. O perfil e as
          candidaturas entram somente na Fase 2 e nas fases seguintes.
        </p>
      </section>
    </main>
  );
}
