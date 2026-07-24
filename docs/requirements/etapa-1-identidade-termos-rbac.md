# Execução da Fase 1 — identidade, termos e RBAC

- Data da verificação: 2026-07-24
- Plano de origem: [`../09-plano-de-acao.md`](../09-plano-de-acao.md)
- Estado: em fechamento; implementação funcional avançada com critérios obrigatórios pendentes

## Escopo entregue

### Conta e cadastro público

- entidade `User` com e-mail normalizado, hash Argon2, papel, estado, datas operacionais e soft
  delete;
- cadastro público limitado a `candidate` e `employer`;
- índice único de e-mail para contas não excluídas;
- escolha de papel e formulário funcional na página inicial;
- criação opcional e idempotente do primeiro admin apenas fora de produção.

### Sessão

- login com access token curto;
- access e refresh tokens enviados em cookies HttpOnly, `SameSite=Lax` e `Secure` em produção;
- refresh token opaco, persistido apenas como hash, rotativo e individualmente revogável;
- logout idempotente com revogação do refresh token e remoção dos cookies;
- bloqueio de login e refresh para contas suspensas ou desabilitadas.

### E-mail e consentimento

- token de verificação de e-mail opaco, com hash, expiração e uso único;
- token exposto somente fora de produção para viabilizar o provider fake local;
- aceite versionado de termos com data, usuário, IP e user agent mínimos;
- guards reutilizáveis para exigir e-mail confirmado e versão atual dos termos.

### Autorização

- autenticação e RBAC aplicados como guards globais no NestJS;
- endpoint de alteração de papel restrito a admin com e-mail confirmado e termos atuais;
- middleware do Next.js para melhorar a experiência nas rotas `/app` e `/admin`;
- backend preservado como fonte de verdade da autorização.

## Rastreabilidade dos requisitos

| Requisito | Estado | Evidência ou pendência |
| --- | --- | --- |
| RF-01/RN-01 | Atendido | DTO e schema aceitam apenas `candidate` e `employer` |
| RF-02 | Atendido | seletor de fluxo em `AuthPanel` |
| RF-03 | Parcial | papel inicial é persistido; onboarding e dashboards distintos ainda não existem |
| RF-04 | Parcial | e-mail, senha e aceite existem; nome e aceites separados ainda faltam |
| RF-05 | Atendido | normalização, consulta prévia e índice parcial único |
| RF-06/RN-09 | Parcial | verificação e guard existem; envio real de e-mail ainda não |
| RF-07 | Parcial | login, logout e renovação existem; recuperação de senha ainda não |
| RF-08/RN-05 | Atendido | guards/decorators e autorização global no backend |
| RF-09 | Parcial | rotas base protegidas; falta completar navegação e testes por papel/estado |
| RF-10/RN-02 | Atendido na API | apenas admin acessa a alteração de papel |
| RN-06/RN-07 | Atendido no modelo atual | aceite versionado com metadados mínimos |
| RN-08 | Atendido como infraestrutura | `TermsGuard` exige a versão configurada nos endpoints decorados |
| RNF-01–03 | Atendido | Argon2, access curto, refresh com hash, rotação e revogação |
| RNF-04 | Não atendido | login e cadastro ainda não possuem rate limiting |
| RNF-05/RNF-10 | Atendido | DTOs, pipe global e guards no backend |

## Evidências automatizadas existentes

- cadastro como candidato e rejeição de e-mail duplicado;
- rejeição de versão antiga dos termos;
- login com senha inválida e válida;
- rotação e revogação de refresh token;
- consumo único do token de verificação;
- negativas dos guards de papel, e-mail confirmado e termos;
- proteção de conta suspensa ou desabilitada implementada no guard de autenticação.

## Homologação local observada

Em 2026-07-24, um fluxo real foi executado contra PostgreSQL 16 temporário após aplicar as duas
migrations:

| Operação | Resultado |
| --- | --- |
| cadastro de candidato | `201` |
| verificação do e-mail | `200`, conta alterada para `active` |
| login | `200` |
| rotação do refresh token | `200`, novo token emitido |
| reutilização do refresh anterior | `401` |
| logout | `204` |
| uso do refresh revogado | `401` |

A homologação confirma o caminho principal, mas não substitui os testes de integração e E2E
automatizados exigidos pela definição de pronto.

## O que falta para concluir a fase

Prioridade de fechamento:

1. implementar recuperação de senha com token de uso único e expiração curta;
2. criar um contrato de envio de e-mail e um provider fake/log separado da resposta HTTP; selecionar
   o provider remoto antes de produção;
3. fazer o bootstrap falhar em produção quando `JWT_ACCESS_SECRET`, origem CORS ou credenciais de
   banco ainda estiverem nos valores locais padrão;
4. coletar o nome exigido no cadastro e definir se termos, privacidade e diretrizes serão um
   documento versionado ou consentimentos distintos;
5. concluir onboarding e destino inicial específicos para candidato e contratante;
6. adicionar testes de integração com controllers e PostgreSQL real, além de E2E dos fluxos
   cadastro → verificação → login → refresh → logout;
7. cobrir RBAC positivo e negativo no endpoint de promoção e proteção frontend por papel/estado;
8. definir e testar a máquina de estados da conta, impedindo que verificação de e-mail reative uma
   conta suspensa ou desabilitada;
9. tornar a rotação do refresh token transacional para impedir duas sessões sucessoras em refreshes
   concorrentes e definir a resposta à reutilização de token;
10. aplicar rate limiting em cadastro, login e emissão de tokens;
11. registrar auditoria mínima para promoção, suspensão e desativação;
12. parar de retornar o access token no corpo quando todos os clientes suportarem o fluxo por cookie,
   reduzindo a superfície de exposição no navegador.

## Decisão de sequência

A Fase 2 ainda não deve ser tratada como iniciada. O próximo marco é fechar os itens 1 a 10 acima,
pois perfis, uploads, vagas e candidaturas dependerão diretamente de identidade, consentimento e
autorização confiáveis. Auditoria completa permanece na Fase 4, mas alterações administrativas da
Fase 1 já precisam produzir evidência mínima antes do piloto.
