# Execução da Fase 1 — identidade, termos e RBAC

- Data da verificação: 2026-07-24
- Plano de origem: [`../09-plano-de-acao.md`](../09-plano-de-acao.md)
- Estado: concluída

## Escopo entregue

### Identidade, consentimento e onboarding

- cadastro público restrito a `candidate` e `employer`, com nome obrigatório e e-mail normalizado;
- senha com Argon2, índice único de e-mail e soft delete;
- termos de uso, política de privacidade e diretrizes de inclusão tratados como três documentos
  obrigatórios e versionados de forma independente;
- evidência de cada aceite com usuário, documento, versão, data, IP e user agent;
- versões vigentes publicadas por `GET /auth/registration-config`;
- onboarding e destino inicial distintos para candidato e contratante;
- destinos próprios para coordenação, administração e conta indisponível.

### E-mail e recuperação de senha

- contrato `EmailSender` desacoplado dos controllers;
- provider `log` somente local e provider HTTP remoto com contrato documentado;
- bootstrap de produção rejeita o provider local ou credenciais incompletas;
- verificação de e-mail e recuperação de senha usam tokens opacos, armazenados como hash, de uso
  único e com expiração;
- solicitação de reset responde de forma indistinguível para e-mail existente ou ausente;
- troca de senha incrementa a versão de autenticação e revoga access e refresh tokens existentes;
- tokens de desenvolvimento não aparecem mais na resposta HTTP.

### Sessão e proteção operacional

- access e refresh tokens somente em cookies HttpOnly, `SameSite=Lax` e `Secure` em produção;
- nenhuma resposta pública de autenticação contém access ou refresh token;
- refresh tokens rotativos organizados em famílias;
- rotação feita em transação com lock pessimista no PostgreSQL;
- duas renovações concorrentes produzem uma sucessora no máximo;
- reutilização revoga toda a família e responde `401`;
- rate limiting persistido no PostgreSQL em cadastro, login, refresh, verificação e recuperação;
- produção falha no bootstrap quando JWT, CORS ou credenciais de banco usam defaults locais.

### RBAC, estados e auditoria

- guards globais mantêm o backend como fonte de verdade;
- promoção de papel e alteração de status exigem admin, e-mail verificado e documentos atuais;
- máquina de estados impede ativar conta sem e-mail confirmado;
- confirmação de e-mail ativa apenas `pending_email`; contas `suspended` e `disabled` preservam o
  bloqueio;
- middleware do frontend protege rotas por papel e estado;
- promoção, suspensão, desativação e reativação registram ator, alvo, motivo, contexto e data;
- auditoria consultável e demais eventos continuam no escopo da Fase 4.

## Rastreabilidade

| Requisito | Estado | Evidência |
| --- | --- | --- |
| RF-01–05 | Atendido | DTOs, schemas, `User`, nome e cadastro público por papel |
| RF-06/RN-09 | Atendido | provider de e-mail, token único e guard de verificação |
| RF-07 | Atendido | login, logout, refresh e recuperação de senha |
| RF-08–10/RN-01–05 | Atendido | guards globais e testes RBAC positivo/negativo |
| RN-06–08 | Atendido | três aceites versionados e `TermsGuard` |
| RN-34–38 | Atendido no corte da fase | bloqueio por estado e auditoria administrativa mínima |
| RNF-01–03 | Atendido | Argon2, access curto, refresh com hash e rotação transacional |
| RNF-04 | Atendido | rate limiting persistido com resposta `429` e `Retry-After` |
| RNF-05/RNF-10 | Atendido | DTOs, pipe global, cookies e guards no backend |

## Evidências automatizadas

A suíte cobre:

- registro dos três consentimentos no PostgreSQL;
- cadastro → verificação → login → refresh → logout por cookies;
- recuperação de senha de uso único e revogação de sessões;
- RBAC negativo e positivo no endpoint de promoção;
- auditoria de promoção, suspensão e desativação;
- verificação de e-mail sem reativação de conta suspensa;
- refreshes concorrentes e detecção de reutilização da família;
- rate limiting de login;
- roteamento frontend positivo e negativo por papel e estado;
- rejeição dos defaults locais no bootstrap de produção.

Comando reproduzível:

```bash
pnpm test:integration
```

O comando sobe `postgres-test` no Compose, recria o banco, executa as três migrations e roda a suíte
com controllers NestJS e Supertest. O banco de desenvolvimento não é utilizado.

## Decisões encerradas

1. Consentimentos são distintos, obrigatórios e versionados por documento.
2. O provider remoto selecionado pelo código é o adapter HTTP; a produção precisa informar endpoint
   e token do gateway escolhido.
3. Reutilização de refresh token revoga toda a família e retorna `401`.
4. Verificação de e-mail nunca altera `suspended` ou `disabled`.
5. O navegador recebe tokens apenas em cookies HttpOnly.

## Próximo marco

A Fase 2 permanece não iniciada. Ela pode começar somente a partir deste fechamento, com perfis
mínimos e controles de visibilidade, sem reabrir as decisões de identidade, consentimento e
autorização estabelecidas aqui.
