# Execução da Fase 4 — denúncias, administração e auditoria

- Data da verificação: 2026-07-26
- Plano de origem: [`../09-plano-de-acao.md`](../09-plano-de-acao.md)
- Estado: concluída e validada localmente

## Objetivo executado

Fechar a governança operacional mínima: relatos autenticados e não enumeráveis, triagem por risco,
decisões rastreáveis, ação imediata sobre vagas públicas, administração segura de contas e consulta
restrita de auditoria.

## Escopo entregue

### Denúncias

- alvos `job`, `profile`, `user` e `application`;
- categorias de discriminação, assédio, fraude, conteúdo inadequado, privacidade, spam e outro;
- resolução do alvo com autorização por recurso antes de persistir;
- descrição entre 20 e 2.000 caracteres;
- prioridade inicial baseada na categoria;
- índice parcial que impede mais de uma denúncia ativa do mesmo autor para o mesmo recurso;
- visão do autor limitada a protocolo, alvo, categoria, status e datas.

### Moderação

- fila de coordenador/admin filtrável por status, prioridade e tipo;
- ordenação por prioridade, chegada e ID;
- transições `start_review`, `resolve`, `dismiss`, `hide_job` e `restore_job`;
- motivo obrigatório entre 10 e 1.000 caracteres;
- decisão, histórico, ação sobre a vaga e auditoria na mesma transação;
- lock pessimista que impede duas decisões finais concorrentes;
- `hide_job` remove a vaga da busca ao mudar o estado para `reported`.

### Administração e auditoria

- listagem paginada de usuários por texto, papel e estado;
- alteração de papel e estado somente por admin, sempre com motivo;
- incremento de `authVersion` em mudança de privilégio;
- revogação de refresh tokens em suspensão/desativação;
- proteção contra auto-rebaixamento, autossuspensão e autodesativação;
- consulta de auditoria somente por admin, com filtros por autor, titular, ação e período;
- DTO de auditoria omite IP, user-agent e conteúdos sensíveis.

### Web

- denúncia contextual em vaga e candidatura;
- páginas de acompanhamento para candidato e contratante;
- fila de denúncias da equipe;
- gestão administrativa de usuários;
- navegador de auditoria e visão geral administrativa;
- navegação por papel e estados de carregamento, vazio, erro e sucesso.

## Rastreabilidade

| Entrega | Evidência principal |
| --- | --- |
| Contratos | `packages/shared/src/platform.ts`, `packages/shared/src/schemas.ts` |
| Migration | `1710000005000-CreateReportsAndGovernance.ts` |
| Denúncias e decisões | `apps/api/src/reports` |
| Administração | `apps/api/src/users/users.controller.ts`, `users.service.ts` |
| Auditoria | `apps/api/src/audit/audit.controller.ts`, `audit.service.ts` |
| Interfaces | `apps/web/components/report-*`, `admin-users.tsx`, `audit-browser.tsx` |
| Rotas | `/app/*/denuncias`, `/admin/usuarios`, `/admin/auditoria` |

## Garantias de privacidade

| Superfície | Garantia |
| --- | --- |
| Resposta do autor | não contém descrição, prioridade, decisões ou identidade da equipe |
| Auditoria | não retorna IP e user-agent pela API; não recebe relato, currículo ou mensagem |
| Alvo privado | autorização por recurso e `404` quando necessário para evitar enumeração |
| Histórico interno | restrito a coordenador/admin |
| Logs de decisão | registram IDs, ação e estados, não o texto do motivo de moderação |

Motivos administrativos de alteração de papel/status permanecem na auditoria restrita porque
justificam a ação sobre a conta; sua retenção deve ser definida antes da operação em produção.

## Critérios de aceite

| Critério | Resultado |
| --- | --- |
| Denúncia exige autenticação e alvo autorizado | Atendido |
| Autor recebe somente acompanhamento mínimo | Atendido |
| Duplicidade ativa é impedida no banco | Atendido |
| Fila é filtrável e priorizada | Atendido |
| Decisão exige motivo e preserva histórico | Atendido |
| Decisões concorrentes são serializadas | Atendido |
| Vaga denunciada deixa a busca | Atendido |
| Coordenação não administra contas nem consulta auditoria | Atendido |
| Suspensão revoga sessão sensível | Atendido |
| Admin não bloqueia a própria conta | Atendido |
| Interface fecha os fluxos operacionais | Atendido |

## Validação automatizada

O arquivo `apps/api/src/integration/phase-four.integration.spec.ts` valida:

1. criação autenticada, entrada inválida, antiduplicidade e visão reduzida;
2. RBAC da fila, priorização, análise e retirada de vaga pública;
3. serialização de duas decisões finais concorrentes;
4. RBAC administrativo, filtros, promoção, suspensão e auditoria mínima.

Executados em 2026-07-26:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

Resultados: 36 testes unitários da API, 14 testes da web, 6 testes dos contratos compartilhados e
21 testes de integração em PostgreSQL passaram. API, web e pacote compartilhado também geraram
builds de produção.

## Limitações conhecidas

- o MVP não oferece anexos, canal de retorno, apelação ou notificações externas;
- `targetType` é polimórfico e sua integridade depende do serviço; a existência é validada antes da
  gravação;
- a restauração de vaga retorna diretamente a `approved`; uma política futura pode exigir nova
  moderação de conteúdo;
- ainda são recomendados E2E de navegador, auditoria de acessibilidade e definição formal de
  retenção para denúncias, decisões e eventos antes do piloto público.
