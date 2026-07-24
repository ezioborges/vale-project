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
      'Dados sensíveis serão opcionais, auditáveis e protegidos por visibilidade.',
    status: 'Planejado',
  },
  {
    title: 'Moderação',
    description:
      'Vagas começam pendentes para reduzir abuso desde o primeiro piloto.',
    status: 'Planejado',
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
          <Link href="/laboratorio-ui">Laboratório UI</Link>
          <a href="#fundacao">Fundação</a>
          <a href="#contratos">Contratos</a>
          <a href="#proximos-passos">Próximos passos</a>
        </nav>
      </header>

      <section className="workspace" aria-labelledby="workspace-title">
        <div className="workspace-copy">
          <StatusPill tone="ready">Fase 1 em fechamento</StatusPill>
          <h1 id="workspace-title">Identidade do MVP</h1>
          <p>
            Cadastro público para candidatos e contratantes, login com sessão,
            aceite de termos, confirmação de e-mail e proteção por papel.
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
          <span>Foco atual</span>
          <h2 id="foundation-title">Segurança antes dos fluxos de vaga</h2>
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
          <span>Sequência</span>
          <h2 id="next-title">Próxima fatia vertical</h2>
        </div>
        <p className="next-step">
          A próxima etapa recomendada é fechar recuperação de senha, entrega de
          e-mail, testes de integração/E2E e rate limiting. Depois disso, o
          desenvolvimento avança para perfis mínimos com controle de
          visibilidade.
        </p>
      </section>
    </main>
  );
}
