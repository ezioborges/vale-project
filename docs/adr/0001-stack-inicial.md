# ADR 0001: Stack inicial do Vale Project

## Status

Proposta aceita para o MVP.

## Contexto

O projeto precisa de uma base moderna, segura, testavel e adequada para evoluir com separacao clara entre frontend e backend. A aplicacao tera regras de acesso por papel, dados sensiveis, fluxos de candidatura, moderacao e auditoria.

## Decisao

Usar a seguinte stack inicial:

| Camada          | Tecnologia                                         |
| --------------- | -------------------------------------------------- |
| Backend         | NestJS                                             |
| ORM             | TypeORM                                            |
| Banco de dados  | PostgreSQL                                         |
| Frontend        | React 19 com Next.js                               |
| Testes backend  | Jest, Supertest e Testcontainers quando necessario |
| Testes frontend | Testing Library e Playwright para E2E              |

## Justificativa

| Escolha    | Motivo                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| NestJS     | Arquitetura modular, suporte forte a DI, guards, pipes, interceptors e testes.                 |
| TypeORM    | Boa integracao com NestJS e suporte a migrations.                                              |
| PostgreSQL | Banco relacional robusto, suporte a indices, JSONB e consultas consistentes.                   |
| Next.js    | Boa experiencia para aplicacoes web modernas, rotas protegidas e SSR/CSR conforme necessidade. |
| React 19   | Base moderna para UI componentizada e evolutiva.                                               |

## Consequencias

| Consequencia                    | Impacto                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Separacao frontend/backend      | Mais clareza de responsabilidades, mas exige contratos de API bem definidos. |
| RBAC no backend                 | Mais seguranca, com necessidade de testes cuidadosos.                        |
| Migrations obrigatorias         | Mais disciplina operacional, menos risco em producao.                        |
| PostgreSQL como fonte principal | Modelo relacional consistente para usuarios, vagas e candidaturas.           |

## Decisoes futuras

| Tema    | Decisao pendente |
| ------- | ---------------- |
| Storage | Supabase Storage |
| E2E     | Playwright.      |
