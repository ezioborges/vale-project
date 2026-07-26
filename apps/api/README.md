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
| `GET /health/live`, `/health/ready`             | Separa liveness da prontidão com resposta pública mínima.     |
| `GET /docs`                                     | Swagger apenas quando habilitado fora de produção.            |
| `GET /auth/registration-config`                 | Publica as versões legais exigidas no cadastro.               |
| `GET /auth/csrf`                                | Emite a prova CSRF assinada para mutações por cookie.         |
| `POST /auth/register`                           | Cadastra candidato ou contratante e inicia sessão por cookie. |
| `POST /auth/verify-email`                       | Consome o token de e-mail uma única vez.                      |
| `POST /auth/login`, `/refresh`, `/logout`       | Gerencia a sessão rotativa; refresh existe apenas no cookie.  |
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
| `POST /jobs`, `GET /jobs/mine`                  | Cria e lista vagas próprias do contratante.                   |
| `PATCH`, ações em `/jobs/mine/:id`              | Edita, pausa, retoma, encerra ou republica uma vaga própria.  |
| `GET /moderation/jobs` e decisão                | Modera vagas com decisão transacional e motivo.               |
| `GET /jobs`, `GET /jobs/:id`                    | Busca pública paginada e detalhe de vagas aprovadas.          |
| `POST /jobs/:id/applications`                   | Cria candidatura única com snapshot privado do currículo.     |
| `GET /applications/mine`                        | Lista candidatura e histórico do candidato.                   |
| `GET /jobs/mine/:id/applications`               | Lista candidaturas recebidas pelo dono da vaga.               |
| `PATCH /applications/:id/status`                | Altera status dentro da máquina de estados.                   |
| `GET /applications/:id/resume`                  | Baixa o snapshot após autorização por recurso.                |
| `POST /reports`, `GET /reports/mine`            | Registra e acompanha denúncia em visão reduzida.              |
| `GET /moderation/reports` e ações               | Prioriza e decide denúncias com histórico.                    |
| `GET /users`                                    | Lista usuários para administração restrita.                   |
| `GET /audit-events`                             | Consulta eventos permitidos apenas para admin.                |

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

Currículos enviados em candidaturas usam uma cópia imutável própria. O prazo é configurado por
`APPLICATION_RESUME_RETENTION_DAYS`; após candidatura terminal ou vaga encerrada, snapshots
expirados são removidos pelo serviço de retenção. O download ocorre apenas por
`GET /applications/:id/resume`, com autorização repetida e headers privados.

## Fronteira HTTP e sessão

Mutações autenticadas por cookie exigem `Origin` ou `Referer` da origem Web exata e o token
double-submit assinado em `X-CSRF-Token`. Login, cadastro, refresh e `GET /auth/csrf` expõem o
token no header; o cookie correspondente não é HttpOnly. Access e refresh permanecem HttpOnly.
Em produção, os nomes usam `__Host-`/`__Secure-`, `Secure` é obrigatório e o refresh fica restrito
ao path público `/api/auth`.

O access token usa somente HS256, `issuer` e `audience` configurados, identificador `sid` da família
de sessão e não carrega e-mail. Respostas de autenticação usam `Cache-Control: no-store`.
