# Execução da Fase 3 — vagas, busca e candidaturas

- Data da verificação: 2026-07-26
- Plano de origem: [`../planos-de-acao/09-plano-de-acao-mvp.md`](../planos-de-acao/09-plano-de-acao-mvp.md)
- Estado: concluída e validada localmente

## Objetivo executado

Entregar o fluxo central `criar vaga -> moderar -> buscar -> candidatar -> acompanhar`, preservando
autorização por recurso e uma cópia privada do currículo usado em cada candidatura.

## Escopo entregue

### Vagas e moderação

- criação e edição por contratante com perfil institucional;
- limite configurável de vagas ativas e regra consistente para faixa salarial;
- estados `pending_review`, `changes_requested`, `approved`, `rejected`, `paused`, `closed` e
  `reported`;
- edição de conteúdo aprovado sempre reaplica moderação;
- fila de coordenação/admin com aprovação, solicitação de ajuste e rejeição motivada;
- lock transacional contra duas decisões sobre a mesma versão;
- pausa, retomada, encerramento e republicação com máquina de estados.

### Busca pública

- lista e detalhe retornam somente vagas `approved`;
- filtros por texto, área, localidade, modalidade, contrato e senioridade;
- paginação limitada e ordenação estável por publicação e ID;
- DTO público não inclui contato institucional privado ou campos internos de moderação;
- páginas responsivas em `/vagas` e `/vagas/[id]`.

### Candidaturas e privacidade

- candidatura atômica e única por vaga/perfil, inclusive sob concorrência;
- elegibilidade exige perfil ativo, currículo PDF e consentimento compatível;
- snapshot imutável do currículo com chave privada e download autenticado;
- histórico de estados com autor e data;
- visão do candidato, visão do dono da vaga e transições permitidas;
- cancelamento remove o acesso relacional do contratante ao perfil e ao snapshot;
- `applications_only` libera o perfil somente ao dono de candidatura não cancelada;
- retenção configurável por `APPLICATION_RESUME_RETENTION_DAYS`, com limpeza de snapshots expirados
  após candidatura terminal ou vaga encerrada.

## Contratos e interfaces

| Área | Evidência |
| --- | --- |
| Contratos | `packages/shared/src/platform.ts`, `packages/shared/src/schemas.ts` |
| Banco | migration `1710000004000-CreateJobsAndApplications.ts` |
| Domínio | `apps/api/src/jobs` |
| Privacidade relacional | `apps/api/src/profiles/profiles.service.ts` |
| Busca | `apps/web/components/jobs-search.tsx`, `job-detail.tsx` |
| Candidato | `apps/web/components/candidate-applications.tsx` |
| Contratante | `apps/web/components/employer-job-manager.tsx` |
| Coordenação | `apps/web/components/moderation-queue.tsx` |

## Decisões relevantes

| Tema | Decisão |
| --- | --- |
| Revisão | qualquer edição de conteúdo volta para `pending_review` |
| Duplicidade | constraint única no banco é a garantia final |
| Currículo | snapshot por candidatura; arquivo corrente do perfil não é exposto ao contratante |
| Cancelamento | candidatura permanece para histórico, mas candidato e arquivo são redigidos do lado do contratante |
| Retenção | prazo padrão de 180 dias, configurável; exclusão só após término do processo |
| Busca | PostgreSQL paginado e indexado, sem motor externo prematuro |
| Logs | IDs e transições em allowlist; texto da vaga, mensagem e currículo não são copiados |

## Critérios de aceite

| Critério | Resultado |
| --- | --- |
| Vaga nasce moderada e não pública | Atendido |
| Edição não burla revisão | Atendido |
| Busca retorna somente `approved` | Atendido |
| Candidatura e snapshot são atômicos | Atendido |
| Duplicidade concorrente é impedida | Atendido |
| Acesso `applications_only` é relacional | Atendido |
| Cancelamento revoga perfil e currículo | Atendido |
| Histórico respeita transições | Atendido |
| Retenção possui prazo e rotina | Atendido |
| Interfaces cobrem os quatro atores | Atendido |

## Validação automatizada

O arquivo `apps/api/src/integration/phase-three.integration.spec.ts` cobre:

1. criação, moderação e proteção da busca pública;
2. candidatura concorrente, snapshot e acesso relacional;
3. transições, cancelamento, revogação e limpeza por retenção;
4. remoderação após edição e decisões concorrentes.

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

- o job de retenção executa no processo da API; produção com múltiplas réplicas deve migrá-lo para
  um scheduler distribuído com exclusão mútua;
- a busca usa `ILIKE` e índices estruturais; relevância, sinônimos e analytics ficam para evolução;
- não há chat, ranking automático, entrevistas, notificações externas ou ATS completo no MVP;
- testes E2E de navegador e auditoria manual com tecnologia assistiva continuam recomendados antes
  do piloto público.
