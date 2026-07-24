# Vale Project

Vale Project e uma aplicacao web focada na empregabilidade da comunidade LGBTQIAP+, com o objetivo de criar um canal de contratacao direto, seguro, respeitoso e inclusivo entre talentos e contratantes.

Este repositorio comeca pela documentacao de produto e arquitetura para orientar o desenvolvimento do MVP.

## Objetivo

Construir um portal de vagas e conexoes profissionais com separacao clara de papeis, controle de acesso por RBAC, protecao de dados sensiveis e fluxos adequados para:

| Papel       | Objetivo principal                                                     |
| ----------- | ---------------------------------------------------------------------- |
| Admin       | Administrar a plataforma, usuarios, configuracoes globais e auditoria. |
| Coordenador | Apoiar operacao, moderar conteudo, analisar denuncias e dar suporte.   |
| Contratante | Publicar vagas, gerenciar processos e encontrar talentos.              |
| Contratado  | Criar perfil profissional, buscar vagas e se candidatar.               |

## Stack

| Camada         | Tecnologia                                                         |
| -------------- | ------------------------------------------------------------------ |
| Backend        | NestJS                                                             |
| ORM            | TypeORM                                                            |
| Banco de dados | PostgreSQL                                                         |
| Frontend       | React 19 e Next.js                                                 |
| Testes         | Jest, Vitest, Testing Library, Supertest e Playwright no ciclo E2E |

## Como executar localmente

Requisitos:

| Ferramenta | Versao recomendada      |
| ---------- | ----------------------- |
| Node.js    | 22+                     |
| pnpm       | Gerenciado por Corepack |
| Docker     | Para PostgreSQL local   |

Primeiro uso:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:up
pnpm --filter @vale/api migration:run
pnpm dev
```

Servicos locais:

| Servico     | URL                          |
| ----------- | ---------------------------- |
| Web         | http://localhost:3000        |
| API health  | http://localhost:3001/health |
| API Swagger | http://localhost:3001/docs   |

Comandos de qualidade:

```bash
pnpm lint
pnpm test
pnpm build
```

## Documentacao

| Arquivo                                                                      | Descricao                                                        |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [docs/00-visao-geral.md](docs/00-visao-geral.md)                             | Visao do produto, publico, objetivos e principios.               |
| [docs/01-requisitos-funcionais.md](docs/01-requisitos-funcionais.md)         | Requisitos funcionais essenciais do MVP.                         |
| [docs/02-requisitos-nao-funcionais.md](docs/02-requisitos-nao-funcionais.md) | Requisitos de seguranca, performance, usabilidade e arquitetura. |
| [docs/03-regras-de-negocio.md](docs/03-regras-de-negocio.md)                 | Regras de negocio cruciais da plataforma.                        |
| [docs/04-arquitetura.md](docs/04-arquitetura.md)                             | Arquitetura inicial proposta para backend, frontend e dominios.  |
| [docs/05-modelo-de-dados.md](docs/05-modelo-de-dados.md)                     | Modelo conceitual inicial de dados.                              |
| [docs/06-seguranca-e-lgpd.md](docs/06-seguranca-e-lgpd.md)                   | Diretrizes de seguranca, privacidade e LGPD.                     |
| [docs/07-testes-e-qualidade.md](docs/07-testes-e-qualidade.md)               | Estrategia inicial de testes e qualidade.                        |
| [docs/08-backlog-e-roadmap.md](docs/08-backlog-e-roadmap.md)                 | Epicos, historias candidatas e roadmap do MVP.                   |
| [docs/09-plano-de-acao.md](docs/09-plano-de-acao.md)                         | Sequencia pratica de desenvolvimento do MVP.                     |
| [docs/10-plano-de-estudos.md](docs/10-plano-de-estudos.md)                   | Plano de estudos para entender as decisoes tecnicas.             |
| [docs/requirements/README.md](docs/requirements/README.md)                   | Estado verificado, evidencias e pendencias por fase.             |
| [docs/runbooks/README.md](docs/runbooks/README.md)                           | Procedimentos de setup, ambientes e seguranca.                   |
| [docs/adr/0001-stack-inicial.md](docs/adr/0001-stack-inicial.md)             | Decisao arquitetural inicial sobre a stack.                      |

## Estrutura do projeto

```text
vale-project/
  apps/
    api/        # Backend NestJS
    web/        # Frontend Next.js
  packages/
    shared/     # Tipos, contratos e utilitarios compartilhados
  docs/
    adr/
    requirements/
    runbooks/
```

| Pasta           | Uso                                                           |
| --------------- | ------------------------------------------------------------- |
| apps/api        | API NestJS, autenticacao, usuarios, termos e acesso ao banco. |
| apps/web        | Aplicacao Next.js e fluxos web iniciais.                      |
| packages/shared | Contratos e utilitarios compartilhados.                       |
| docs            | Documentacao de produto, arquitetura, seguranca e qualidade.  |

## Status

Fase atual: Fase 1 em fechamento. A Fase 0 esta concluida; cadastro, sessao, verificacao de e-mail,
termos e RBAC ja possuem implementacao inicial. Recuperacao de senha, provider de e-mail, testes de
integracao/E2E e rate limiting ainda precisam ser concluidos antes da Fase 2.
