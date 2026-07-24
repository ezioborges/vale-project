# API

Aplicacao backend NestJS do Vale Project.

## Stack planejada

| Item                | Tecnologia                                         |
| ------------------- | -------------------------------------------------- |
| Framework           | NestJS                                             |
| ORM                 | TypeORM                                            |
| Banco               | PostgreSQL                                         |
| Documentacao de API | OpenAPI/Swagger                                    |
| Testes              | Jest, Supertest e Testcontainers quando necessario |

## Modulos sugeridos

| Modulo       | Responsabilidade                                                           |
| ------------ | -------------------------------------------------------------------------- |
| auth         | Autenticacao, refresh token, verificacao de e-mail e recuperacao de senha. |
| users        | Conta base, papeis, status e administracao de usuarios.                    |
| profiles     | Perfis de candidatos e contratantes.                                       |
| jobs         | Criacao, moderacao, publicacao e busca de vagas.                           |
| applications | Candidaturas e historico de status.                                        |
| moderation   | Denuncias, decisoes e fila de revisao.                                     |
| audit        | Logs de auditoria para acoes sensiveis.                                    |

## Principios de implementacao

| Principio       | Diretriz                                             |
| --------------- | ---------------------------------------------------- |
| RBAC no backend | Guards devem ser a fonte de verdade da autorizacao.  |
| Migrations      | Usar migrations versionadas do TypeORM.              |
| Validacao       | Validar entradas com DTOs e pipes.                   |
| Testes          | Cobrir services, guards e fluxos E2E criticos.       |
| Seguranca       | Nunca expor senha, token ou dados sensiveis em logs. |

## Comandos

```bash
pnpm --filter @vale/api dev
pnpm --filter @vale/api test
pnpm --filter @vale/api test:integration
pnpm --filter @vale/api build
pnpm --filter @vale/api migration:run
```

## Endpoints da Fase 1

| Endpoint                                        | Uso                                                           |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `GET /health`                                   | Verifica aplicação e conexão com PostgreSQL.                  |
| `GET /docs`                                     | Swagger local da API.                                         |
| `GET /auth/registration-config`                 | Publica as versões legais exigidas no cadastro.               |
| `POST /auth/register`                           | Cadastra candidato ou contratante e inicia sessão por cookie. |
| `POST /auth/verify-email`                       | Consome o token de e-mail uma única vez.                      |
| `POST /auth/login`, `/refresh`, `/logout`       | Gerencia a sessão rotativa por cookies HttpOnly.              |
| `POST /auth/forgot-password`, `/reset-password` | Recupera senha sem revelar a existência da conta.             |
| `PATCH /users/:id/role`                         | Altera papel com RBAC admin e auditoria.                      |
| `PATCH /users/:id/status`                       | Suspende, desativa ou reativa com auditoria.                  |

## Contrato do provider HTTP de e-mail

Em produção, `EMAIL_PROVIDER=http` é obrigatório. A API envia `POST` para
`EMAIL_HTTP_ENDPOINT`, com `Authorization: Bearer <EMAIL_HTTP_TOKEN>` e JSON contendo
`from`, `to`, `subject`, `text` e `html`. Qualquer resposta fora de `2xx` é falha de entrega.
O adapter remoto ou gateway escolhido deve aceitar esse contrato; o provider `log` é rejeitado no
bootstrap de produção.
