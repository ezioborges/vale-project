# Execução da Fase 0 — fundação técnica

- Data da verificação: 2026-07-24
- Plano de origem: [`../09-plano-de-acao.md`](../09-plano-de-acao.md)
- Estado: concluída e validada localmente

## Objetivo executado

Disponibilizar uma base versionada e reproduzível para desenvolver frontend, backend, contratos e
banco de dados no mesmo repositório, com validação de ambiente, qualidade automatizada e evolução
do schema por migrations.

## Escopo entregue

### Monorepo e contratos

- workspace pnpm com `apps/api`, `apps/web` e `packages/shared`;
- versões resolvidas pelo `pnpm-lock.yaml` e gerenciador declarado no `package.json`;
- tipos e schemas Zod compartilhados para papéis, estados, autenticação e health check;
- TypeScript estrito compartilhado, incluindo `noUncheckedIndexedAccess` e
  `noImplicitOverride`.

### API base

- NestJS com configuração validada por Zod no bootstrap;
- TypeORM com `synchronize: false` e migrations versionadas;
- PostgreSQL 16 no Docker Compose;
- health check que consulta o banco e falha com `503` quando a dependência está indisponível;
- Swagger em `/docs`, DTOs validados por `ValidationPipe` e CORS restrito à origem configurada.

### Web base

- Next.js com App Router e React;
- layout, fundação visual, cliente HTTP e validação de respostas da API;
- rotas iniciais pública, autenticada e administrativa;
- integração com os contratos de `packages/shared`.

### Qualidade e integração contínua

- ESLint, Prettier, Jest, Vitest, typecheck e build por workspace;
- workflow de CI para instalação pelo lockfile, lint, testes e build;
- testes unitários para contratos, health check, cliente HTTP e capacidades de identidade;
- documentação de arquitetura e ADR da stack inicial.

## Rastreabilidade

| Entrega da Fase 0 | Evidência principal |
| --- | --- |
| Monorepo | `pnpm-workspace.yaml`, `apps/*`, `packages/shared` |
| Configuração | `.env.example`, `env.validation.ts`, `tsconfig.base.json` |
| API base | `apps/api/src/main.ts`, `app.module.ts`, `health/*` |
| Swagger e DTOs | `apps/api/src/main.ts`, `apps/api/src/**/dto` |
| Banco versionado | `docker-compose.yml`, `apps/api/src/database/migrations` |
| Web base | `apps/web/app`, `apps/web/components`, `apps/web/lib/api.ts` |
| CI inicial | `.github/workflows/ci.yml` |

## Critérios de aceite

| Critério | Resultado |
| --- | --- |
| Projeto instalável pelo lockfile | Atendido por `pnpm install --frozen-lockfile` |
| API responde health com aplicação e banco | Atendido em PostgreSQL temporário isolado |
| Swagger local disponível | Atendido em `/docs` |
| Lint, testes e build passam | Atendido localmente e configurado na CI |
| Banco evolui sem sincronização automática | Atendido; `synchronize` está desabilitado |

## Validação local

Executados em 2026-07-24:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @vale/api migration:run
```

As migrations e o health check foram exercitados contra um PostgreSQL 16 temporário, sem reutilizar
o volume de desenvolvimento.

## Melhorias que não reabrem a fase

- incluir `format:check` e `typecheck` como gates explícitos do workflow de CI;
- adicionar um script raiz `validate` para reproduzir todos os gates com um único comando;
- documentar política de branches e revisão em `CONTRIBUTING.md`;
- adicionar varredura automatizada de segredos e templates de pull request.

Esses itens fortalecem governança e ergonomia, mas a base exigida pelos critérios atuais da Fase 0
já está disponível.
