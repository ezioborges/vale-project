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
| Docker     | Para todos os serviços  |

Primeiro uso:

```bash
cp .env.example .env
docker compose up -d
```

### Desenvolvimento com Docker Compose

O Compose instala as dependências com `pnpm`, aplica as migrations e inicia PostgreSQL, API e Web
com hot reload dentro de containers. Os arquivos do projeto são montados no container, portanto as
alterações locais são refletidas imediatamente.

```bash
cp .env.example .env
docker compose up -d
```

O serviço `migrate` termina com sucesso depois de aplicar as migrations; isso é esperado. A API só
inicia depois dele, e o Web só inicia quando a API estiver saudável.

Para encerrar os serviços:

```bash
docker compose down
```

Para apagar o banco local, reaplicar as migrations e criar contas de teste para todas as roles:

```bash
docker compose --profile maintenance run --rm db-reset
```

O mesmo procedimento, com nome explícito de reseed, pode ser executado com:

```bash
docker compose --profile maintenance run --rm db-reseed
```

Também estão disponíveis os atalhos `pnpm db:reset:dev` e `pnpm db:reseed:dev`.

As contas criadas são `admin@local.vale.test`, `coordinator@local.vale.test`,
`employer@local.vale.test` e `candidate@local.vale.test`. Todas usam a senha
`ValeDev2026!`, estão ativas, têm o e-mail verificado e aceitaram os documentos legais atuais.
Também são criados perfis fictícios de contratante verificado e pessoa candidata.

Esse comando é destrutivo e exclusivo para desenvolvimento: todos os dados do banco local serão
apagados. O volume de arquivos de perfil não é removido automaticamente.

Esse Compose é exclusivo para desenvolvimento: usa credenciais e segredos locais, expõe as portas
diretamente no `localhost` e não deve ser usado como configuração de produção. O volume
`vale-postgres-data` preserva o banco local; para removê-lo, use `docker compose down -v` somente
quando isso for intencional. As portas públicas padrão são Web `3000`, API `3001` e PostgreSQL
`55432`; altere `WEB_HOST_PORT`, `API_HOST_PORT` ou `POSTGRES_HOST_PORT` se alguma estiver ocupada.

Servicos locais:

| Servico     | URL                          |
| ----------- | ---------------------------- |
| Web         | http://localhost:3000        |
| API health  | http://localhost:3001/health |
| API Swagger | http://localhost:3001/docs   |

Comandos de qualidade:

```bash
pnpm validate
pnpm audit:prod
```

`pnpm validate` executa format check, lint, typecheck, testes unitários, integração com PostgreSQL
real e build. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para a política de audit, atualizações do
lockfile e exceções temporárias.

## Documentacao

| Arquivo                                                                                                                | Descricao                                                        |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [docs/00-visao-geral.md](docs/00-visao-geral.md)                                                                       | Visao do produto, publico, objetivos e principios.               |
| [docs/01-requisitos-funcionais.md](docs/01-requisitos-funcionais.md)                                                   | Requisitos funcionais essenciais do MVP.                         |
| [docs/02-requisitos-nao-funcionais.md](docs/02-requisitos-nao-funcionais.md)                                           | Requisitos de seguranca, performance, usabilidade e arquitetura. |
| [docs/03-regras-de-negocio.md](docs/03-regras-de-negocio.md)                                                           | Regras de negocio cruciais da plataforma.                        |
| [docs/04-arquitetura.md](docs/04-arquitetura.md)                                                                       | Arquitetura inicial proposta para backend, frontend e dominios.  |
| [docs/05-modelo-de-dados.md](docs/05-modelo-de-dados.md)                                                               | Modelo conceitual inicial de dados.                              |
| [docs/06-seguranca-e-lgpd.md](docs/06-seguranca-e-lgpd.md)                                                             | Diretrizes de seguranca, privacidade e LGPD.                     |
| [docs/07-testes-e-qualidade.md](docs/07-testes-e-qualidade.md)                                                         | Estrategia inicial de testes e qualidade.                        |
| [docs/08-testes-manuais-interface.md](docs/08-testes-manuais-interface.md)                                             | Roteiro completo de testes manuais pela interface.               |
| [docs/08-backlog-e-roadmap.md](docs/08-backlog-e-roadmap.md)                                                           | Epicos, historias candidatas e roadmap do MVP.                   |
| [docs/planos-de-acao/09-plano-de-acao-mvp.md](docs/planos-de-acao/09-plano-de-acao-mvp.md)                             | Sequencia pratica de desenvolvimento do MVP.                     |
| [docs/10-plano-de-estudos.md](docs/10-plano-de-estudos.md)                                                             | Plano de estudos para entender as decisoes tecnicas.             |
| [docs/11-estudo-pnpm-workspaces.md](docs/11-estudo-pnpm-workspaces.md)                                                 | Estudo sobre a organizacao e os comandos do monorepo.            |
| [docs/planos-de-acao/12-plano-aplicacao-design.md](docs/planos-de-acao/12-plano-aplicacao-design.md)                   | Sequencia de adocao do design system na interface.               |
| [docs/planos-de-acao/13-plano-melhorias-seguranca-fluxo.md](docs/planos-de-acao/13-plano-melhorias-seguranca-fluxo.md) | Analise priorizada de seguranca, fluxo e operacao.               |
| [docs/planos-de-acao/etapas/14-plano-acao-etapa-0.md](docs/planos-de-acao/etapas/14-plano-acao-etapa-0.md)             | Execucao detalhada de baseline, CI e dependencias.               |
| [docs/15-execucao-etapa-1.md](docs/15-execucao-etapa-1.md)                                                             | Fronteira HTTP, sessao, CSRF, headers e topologia segura.        |
| [docs/requirements/README.md](docs/requirements/README.md)                                                             | Estado verificado, evidencias e pendencias por fase.             |
| [docs/runbooks/README.md](docs/runbooks/README.md)                                                                     | Procedimentos de setup, ambientes e seguranca.                   |
| [docs/adr/0001-stack-inicial.md](docs/adr/0001-stack-inicial.md)                                                       | Decisao arquitetural inicial sobre a stack.                      |

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

| Pasta           | Uso                                                          |
| --------------- | ------------------------------------------------------------ |
| apps/api        | API NestJS, domínio, governança, privacidade e banco.        |
| apps/web        | Aplicação Next.js pública e áreas protegidas por papel.      |
| packages/shared | Contratos Zod e tipos compartilhados.                        |
| docs            | Documentação de produto, arquitetura, segurança e qualidade. |

## Status

Fase atual: Fases 0 a 4 concluídas e validadas localmente. O fluxo de vaga moderada até candidatura,
snapshots privados de currículo, denúncias, gestão administrativa e auditoria consultável possuem
cobertura automatizada com PostgreSQL real. Consulte
[`docs/requirements/`](docs/requirements/README.md) para as evidências e limitações por fase.
