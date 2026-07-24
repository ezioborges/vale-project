import Link from 'next/link';

export default function EmployerHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Área do contratante">
          <Link href="/app/contratante">Organização</Link>
        </nav>
      </header>
      <section className="content-band">
        <div className="section-heading">
          <span>Contratante</span>
          <h1>Área da organização</h1>
        </div>
        <p className="next-step">
          A conta está confirmada e autorizada para o fluxo de contratante. O
          perfil institucional e a publicação de vagas começam após a Fase 1.
        </p>
      </section>
    </main>
  );
}
