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

## Endpoints entregues

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
| `GET /profiles/me`                              | Retorna o perfil do titular autenticado.                      |
| `PATCH /profiles/candidate/me`                  | Cria ou atualiza o perfil profissional.                       |
| `PATCH /profiles/candidate/me/visibility`       | Altera a visibilidade do candidato.                           |
| `PATCH /profiles/candidate/me/activation`       | Ativa ou desativa o perfil sem apagar dados.                  |
| `PATCH /profiles/employer/me`                   | Cria ou atualiza o perfil institucional.                      |
| `GET /profiles/candidates/:id`                  | Aplica autorização por recurso antes de retornar o perfil.    |
| `POST`, `GET`, `DELETE /profiles/files`         | Gerencia arquivos privados com autorização e auditoria.       |

## Contrato do provider HTTP de e-mail

Em produção, `EMAIL_PROVIDER=http` é obrigatório. A API envia `POST` para
`EMAIL_HTTP_ENDPOINT`, com `Authorization: Bearer <EMAIL_HTTP_TOKEN>` e JSON contendo
`from`, `to`, `subject`, `text` e `html`. Qualquer resposta fora de `2xx` é falha de entrega.
O adapter remoto ou gateway escolhido deve aceitar esse contrato; o provider `log` é rejeitado no
bootstrap de produção.

## Storage de arquivos de perfil

Em desenvolvimento, `STORAGE_DRIVER=local` grava os arquivos fora da árvore pública no diretório
definido por `PROFILE_STORAGE_ROOT`. Produção exige `STORAGE_DRIVER=s3` e as variáveis
`S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY`. O adapter usa
assinatura AWS v4 e atende S3, R2 e serviços compatíveis por path-style URL.

Os arquivos não possuem URL pública. Use `GET /profiles/files/:id`, que repete a autorização do
titular, da equipe ou da política de visibilidade do candidato.
