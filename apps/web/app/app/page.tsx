import Link from 'next/link';

export default function AppHome() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar" aria-label="Navegação da aplicação">
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
          <span>Sessão protegida</span>
          <h1>Conta autenticada</h1>
        </div>
        <p className="next-step">
          Esta área fica disponível apenas quando há sessão ativa. As ações
          sensíveis continuam dependendo dos guards de e-mail, termos e papel no
          backend.
        </p>
      </section>
    </main>
  );
}
