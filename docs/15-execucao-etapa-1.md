# Execução da etapa 1 — fronteira HTTP e sessão

## Decisões

- produção usa uma origem HTTPS única; o proxy encaminha `/api/*` ao NestJS e remove o prefixo;
- CORS aceita somente a origem Web configurada e apenas os métodos e headers necessários;
- access, refresh e CSRF são cookies host-only; em produção usam prefixos seguros;
- refresh não é aceito no corpo e fica restrito ao cookie no path `/api/auth` da origem pública;
- mutações autenticadas por cookie exigem double-submit CSRF assinado e origem ou referer exato;
- access tokens usam HS256, issuer, audience e `sid`, sem e-mail no payload;
- Swagger é recusado em produção;
- `/health/live` não consulta dependências e `/health/ready` testa PostgreSQL sem expor detalhes.

## Proteções HTTP

A API e o frontend emitem CSP em report-only, bloqueio de framing, `nosniff`, política de referrer e
Permissions Policy restritiva. HSTS permanece responsabilidade do proxy e só deve ser habilitado
depois da confirmação de HTTPS para os subdomínios afetados.

Todas as respostas do controller de autenticação usam `Cache-Control: no-store`. O CSRF pode ser
inicializado por `GET /auth/csrf`; login, cadastro e refresh também renovam ou preservam uma prova
válida.

## Evidência automatizada

Os testes cobrem:

- CSRF ausente, origem inválida e cookie de refresh ausente;
- rejeição do refresh token enviado no corpo;
- token expirado, HS256, issuer, audience, `sid` e ausência de e-mail;
- rotação concorrente, reutilização de refresh e logout;
- CORS exato, headers de segurança, respostas sem cache e Swagger ausente;
- separação entre liveness e readiness com contrato público mínimo;
- envio automático de `X-CSRF-Token` nas mutações do cliente Web.

O gate de conclusão é `pnpm validate`, seguido por `pnpm audit:prod`.

## Resultado verificado em 2026-07-26

- `pnpm validate`: passou em format check, lint, typecheck, 63 testes unitários/frontend/shared,
  22 testes de integração com PostgreSQL e builds de shared, API e Web;
- `pnpm audit:prod`: política passou sem alerta crítico/alto bloqueante; permanece uma exceção
  temporária válida para `GHSA-mh99-v99m-4gvg` em `brace-expansion`, já controlada pela etapa 0;
- `git diff --check`: passou sem erro de whitespace.
