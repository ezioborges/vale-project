import Link from 'next/link';

export default function AccountUnavailable() {
  return (
    <main className="app-shell protected-area">
      <header className="topbar">
        <Link className="brand" href="/">
          Vale Project
        </Link>
      </header>
      <section className="content-band">
        <div className="section-heading">
          <span>Estado da conta</span>
          <h1>Esta conta está indisponível</h1>
        </div>
        <p className="next-step">
          Contas suspensas ou desabilitadas não podem acessar áreas protegidas.
          Entre em contato com o suporte para revisar a situação.
        </p>
      </section>
    </main>
  );
}
