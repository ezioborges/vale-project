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
pnpm --filter @vale/api build
pnpm --filter @vale/api migration:run
```

## Endpoints iniciais

| Endpoint      | Uso                                          |
| ------------- | -------------------------------------------- |
| `GET /health` | Verifica aplicacao e conexao com PostgreSQL. |
| `GET /docs`   | Swagger local da API.                        |
