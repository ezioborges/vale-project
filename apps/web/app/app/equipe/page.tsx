import Link from 'next/link';

export default function TeamHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
      </header>
      <section className="content-band">
        <div className="section-heading">
          <span>Coordenação</span>
          <h1>Área da equipe</h1>
        </div>
        <p className="next-step">
          Esta entrada é exclusiva para coordenação; ações administrativas
          continuam autorizadas individualmente pela API.
        </p>
      </section>
    </main>
  );
}
