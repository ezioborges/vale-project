import Link from 'next/link';

export default function AdminHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar" aria-label="Navegação administrativa">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Áreas protegidas">
          <Link href="/app">Conta</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <section className="content-band">
        <div className="section-heading">
          <span>Admin</span>
          <h1>Área administrativa inicial</h1>
        </div>
        <p className="next-step">
          A entrada desta rota é filtrada pela role no frontend, enquanto a API
          mantém a autorização real para promoção de papéis internos.
        </p>
      </section>
    </main>
  );
}
