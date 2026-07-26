import { jobStatuses, userRoles } from '@vale/shared';
import Link from 'next/link';

import { AuthPanel } from '@/components/auth-panel';
import { StatusPill } from '@/components/status-pill';

const foundationItems = [
  {
    title: 'Identidade',
    description: 'Cadastro, login, termos e papéis já formam a base de acesso.',
    status: 'Em uso',
  },
  {
    title: 'Privacidade',
    description:
      'Perfis e currículos são protegidos por consentimento e relação de candidatura.',
    status: 'Em uso',
  },
  {
    title: 'Moderação',
    description:
      'Vagas começam pendentes para reduzir abuso desde o primeiro piloto.',
    status: 'Em uso',
  },
];

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar" aria-label="Navegação principal">
        <Link className="brand" href="/">
          Vale Project
        </Link>
        <nav className="nav-links" aria-label="Áreas iniciais">
          <Link href="/vagas">Explorar vagas</Link>
          <Link href="/laboratorio-ui">Laboratório UI</Link>
          <a href="#fundacao">Fundação</a>
          <a href="#contratos">Contratos</a>
          <a href="#proximos-passos">Próximos passos</a>
        </nav>
      </header>

      <section className="workspace" aria-labelledby="workspace-title">
        <div className="workspace-copy">
          <StatusPill tone="ready">Fluxo central disponível</StatusPill>
          <h1 id="workspace-title">Trabalho com segurança e respeito</h1>
          <p>
            Vagas moderadas, perfis com privacidade explícita e candidaturas
            acompanhadas de ponta a ponta.
          </p>
        </div>

        <AuthPanel />
      </section>

      <section
        className="content-band"
        id="fundacao"
        aria-labelledby="foundation-title"
      >
        <div className="section-heading">
          <span>Fundação do produto</span>
          <h2 id="foundation-title">Segurança dentro dos fluxos de vaga</h2>
        </div>

        <div className="item-grid">
          {foundationItems.map((item) => (
            <article className="work-card" key={item.title}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <StatusPill tone="neutral">{item.status}</StatusPill>
            </article>
          ))}
        </div>
      </section>

      <section
        className="content-band muted"
        id="contratos"
        aria-labelledby="contracts-title"
      >
        <div className="section-heading">
          <span>Contratos públicos</span>
          <h2 id="contracts-title">
            Valores compartilhados sem regra sensível
          </h2>
        </div>

        <div className="contract-columns">
          <div>
            <h3>Papéis</h3>
            <ul>
              {userRoles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Status de vaga</h3>
            <ul>
              {jobStatuses.map((status) => (
                <li key={status}>{status}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        className="content-band"
        id="proximos-passos"
        aria-labelledby="next-title"
      >
        <div className="section-heading">
          <span>Fase 3</span>
          <h2 id="next-title">O ciclo central está conectado</h2>
        </div>
        <p className="next-step">
          Contratantes enviam vagas, a coordenação modera, candidatos buscam e
          revisam o compartilhamento antes de se candidatar, e ambas as partes
          acompanham o histórico sem abrir um banco global de talentos.
        </p>
      </section>
    </main>
  );
}
