# Plano de Ação do MVP

Este plano transforma a documentação inicial em uma sequência prática de desenvolvimento. O objetivo é reduzir riscos desde cedo, validar o produto com usuários reais e manter segurança, privacidade e moderação como fundação, não como ajuste tardio.

## Diagnostico

O Vale Project tem um domínio sensível: empregabilidade para a comunidade LGBTQIAP+, com dados pessoais, possíveis dados sensíveis, relação assimétrica entre candidatos e contratantes, necessidade de moderação e risco real de exposição indevida.

Por isso, o MVP não deve ser tratado apenas como um portal de vagas. O núcleo do produto é um fluxo confiável de identidade, consentimento, visibilidade, publicação, candidatura, moderação e auditoria.

## Principios de execucao

| Princípio             | Aplicação                                                                            |
| --------------------- | ------------------------------------------------------------------------------------ |
| Segurança primeiro    | Autenticação, RBAC, auditoria e privacidade entram na base técnica inicial.          |
| Escopo vertical       | Cada fase deve entregar fluxos utilizáveis de ponta a ponta, mesmo que simples.      |
| Dados mínimos         | Coletar apenas o necessário para validar o MVP. Dados sensíveis devem ser opcionais. |
| Moderação desde cedo  | Vagas e denúncias precisam nascer com status, histórico e decisão rastreável.        |
| Contratos claros      | API documentada, DTOs validados e tipos compartilhados quando fizer sentido.         |
| Qualidade incremental | Testes obrigatórios nos fluxos críticos, sem tentar cobrir tudo no primeiro ciclo.   |

## Estado da execução

Última verificação: 2026-07-24.

| Fase | Estado verificado | Próximo marco |
| --- | --- | --- |
| 0 — Fundação técnica | Concluída | reforçar gates de CI sem reabrir a fase |
| 1 — Identidade, termos e RBAC | Concluída | preservar os contratos durante as fases seguintes |
| 2 — Perfis e privacidade | Não iniciada | próximo marco autorizado |
| 3 — Vagas, busca e candidaturas | Não iniciada | depende de perfis e visibilidade |
| 4 — Denúncias, administração e auditoria | Não iniciada | depende dos fluxos de negócio anteriores |

As evidências e pendências detalhadas ficam em [`requirements/`](requirements/README.md). Os
procedimentos reproduzíveis de setup, ambientes e segurança ficam em
[`runbooks/`](runbooks/README.md).

## Decisoes imediatas

Estas decisoes devem ser fechadas antes ou durante a Fase 0.

| Tema                      | Recomendação para MVP                                                               | Motivo                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Gerenciador de monorepo   | pnpm workspaces                                                                     | Simples, rápido e bom para apps + packages.                                            |
| E2E                       | Playwright                                                                          | Melhor cobertura cross-browser e boa integração com Next.js.                           |
| Validação compartilhada   | Zod no frontend e DTOs no backend                                                   | Evita acoplamento excessivo e mantém NestJS idiomático.                                |
| Senha                     | Argon2                                                                              | Forte e adequado para novas aplicações.                                                |
| Auth web                  | Cookie HttpOnly para refresh token e access token curto em memória ou cookie seguro | Reduz exposição a XSS e facilita revogação.                                            |
| Upload no MVP             | Adapter local em desenvolvimento, S3/R2 em produção                                 | Evita bloquear o MVP e preserva caminho para URLs temporárias.                         |
| E-mail no desenvolvimento | Provider fake/log + contrato de serviço                                             | Permite testar verificação e recuperação sem depender do provedor final.               |
| Busca inicial             | PostgreSQL com índices e `ILIKE`/full-text simples                                  | Suficiente para MVP antes de adotar motor externo.                                     |
| Deploy inicial            | A decidir depois da Fase 0                                                          | Evita escolher provedor antes de conhecer necessidades reais de banco, storage e jobs. |

## Fase 0: Fundação técnica

Objetivo: criar uma base executável, testável e versionável para backend, frontend e contratos.

### Entregas

| Entrega      | Resultado esperado                                                            |
| ------------ | ----------------------------------------------------------------------------- |
| Monorepo     | `apps/api`, `apps/web` e `packages/shared` com scripts padronizados.          |
| Configuração | `.env.example`, validação de envs, lint, formatação e tsconfig compartilhado. |
| API base     | NestJS, health check, config tipada, Swagger, TypeORM e PostgreSQL.           |
| Web base     | Next.js, layout autenticável, design foundation e cliente HTTP.               |
| Banco        | Docker Compose para PostgreSQL e primeira migration.                          |
| CI inicial   | Lint, testes unitários e build de API/web.                                    |

### Critérios de aceite

| Critério                  | Validação                                                      |
| ------------------------- | -------------------------------------------------------------- |
| Projeto sobe localmente   | `pnpm dev` ou comandos equivalentes documentados.              |
| API responde health check | Endpoint de saúde com status da aplicação e do banco.          |
| Swagger existe            | Contrato inicial acessível em ambiente local.                  |
| CI roda                   | Lint, testes e build passam.                                   |
| Banco versionado          | Nenhum uso de sincronização automática do TypeORM em produção. |

## Fase 1: Identidade, termos e RBAC

Objetivo: entregar cadastro, login e proteção de acesso por papel com consentimentos básicos.

### Entregas

| Entrega          | Resultado esperado                                                |
| ---------------- | ----------------------------------------------------------------- |
| User             | Entidade com e-mail, senha, role, status e soft delete.           |
| Cadastro público | Apenas `candidate` e `employer`, escolhido no início.             |
| Login/logout     | Access token curto, refresh token rotativo e revogável.           |
| E-mail           | Verificação obrigatória antes de publicar vaga ou candidatar-se.  |
| Termos           | Registro de aceite com versão, data, usuário e metadados mínimos. |
| RBAC             | Guards no backend e proteção de rotas no frontend.                |
| Seed seguro      | Criação controlada do primeiro admin em ambiente local/dev.       |

### Histórias prioritárias

| História                                    | Prioridade |
| ------------------------------------------- | ---------: |
| US-01: escolher fluxo de cadastro           |       Alta |
| US-02: cadastro de candidato                |       Alta |
| US-04: cadastro de contratante              |       Alta |
| Admin inicial e promoção de papéis internos |       Alta |

### Testes obrigatorios

| Fluxo    | Cobertura minima                                     |
| -------- | ---------------------------------------------------- |
| Cadastro | Role correto, email unico, aceite obrigatorio.       |
| Login    | Senha invalida, senha valida, refresh token, logout. |
| RBAC     | Bloqueio de endpoints por role incorreta.            |
| Termos   | Registro de versao e bloqueio quando ausente.        |

## Fase 2: Perfis e privacidade

Objetivo: permitir que candidato e contratante completem perfis com controle de visibilidade.

### Entregas

| Entrega          | Resultado esperado                                                   |
| ---------------- | -------------------------------------------------------------------- |
| CandidateProfile | Nome de exibição, bio, localidade, preferências, skills e currículo. |
| EmployerProfile  | Tipo, responsável, organização, segmento, localidade e descrição.    |
| Visibilidade     | `private`, `applications_only`, `verified_employers`.                |
| Uploads          | Avatar/logo/currículo com validação de tipo, tamanho e permissão.    |
| Auditoria mínima | Eventos para atualizações sensíveis e alteração de visibilidade.     |

### Corte recomendado do MVP

Para acelerar sem ferir a privacidade, manter experiências, formação e skills como JSONB estruturado no primeiro ciclo. Normalizar em tabelas próprias somente quando houver necessidade de busca, filtros ou analytics mais finos.

### Testes obrigatorios

| Fluxo              | Cobertura minima                                      |
| ------------------ | ----------------------------------------------------- |
| Perfil candidato   | Criar, editar e alterar visibilidade.                 |
| Perfil contratante | Criar e editar dados institucionais.                  |
| Privacidade        | Contratante nao acessa dados completos sem permissao. |
| Upload             | Rejeicao de tipo/tamanho invalido.                    |

## Fase 3: Vagas, busca e candidaturas

Objetivo: entregar o primeiro fluxo central do produto: contratante cria vaga, coordenação aprova, candidato busca e se candidata.

### Entregas

| Entrega               | Resultado esperado                                                |
| --------------------- | ----------------------------------------------------------------- |
| Job                   | Criar, editar, pausar, encerrar e republicar.                     |
| Moderação prévia      | Nova vaga entra em `pending_review`.                              |
| Busca                 | Listagem pública/autenticada apenas de vagas aprovadas e ativas.  |
| Filtros               | Área/palavra-chave, localidade, modalidade, regime e senioridade. |
| Application           | Candidatura única, status inicial e histórico de mudança.         |
| Gestão do contratante | Visualizar candidaturas das próprias vagas.                       |

### Histórias prioritárias

| História                                 | Prioridade |
| ---------------------------------------- | ---------- |
| US-05: criar vaga                        | Alta       |
| US-06: revisar vaga pendente             | Alta       |
| US-07: buscar vagas                      | Alta       |
| US-08: candidatar-se                     | Alta       |
| US-09: visualizar candidaturas recebidas | Alta       |

### Testes obrigatorios

| Fluxo           | Cobertura minima                                               |
| --------------- | -------------------------------------------------------------- |
| Criacao de vaga | Requer role employer, email confirmado e aceite de diretrizes. |
| Moderacao       | Aprovar/rejeitar com motivo e auditoria.                       |
| Busca           | Apenas vagas aprovadas, ativas e paginadas.                    |
| Candidatura     | Impedir duplicidade e vagas indisponiveis.                     |
| Visibilidade    | Contratante ve apenas dados permitidos da candidatura.         |

## Fase 4: Denúncias, administração e auditoria

Objetivo: fechar o ciclo de governança mínima da plataforma.

### Entregas

| Entrega            | Resultado esperado                                        |
| ------------------ | --------------------------------------------------------- |
| Report             | Denunciar vaga, perfil, usuário ou candidatura.           |
| Fila de moderação  | Coordenadores analisam denúncias por status e prioridade. |
| ModerationDecision | Decisões com motivo, autor, entidade e data.              |
| Admin              | Gerenciar usuários, papéis internos e status de conta.    |
| AuditLog           | Consulta restrita, filtros e metadata sem segredos.       |

### Testes obrigatorios

| Fluxo     | Cobertura minima                                              |
| --------- | ------------------------------------------------------------- |
| Denuncia  | Criar denuncia autenticada e exibir status limitado ao autor. |
| Decisao   | Coordenador resolve com motivo e gera auditoria.              |
| Suspensao | Usuario suspenso perde acoes sensiveis.                       |
| Admin     | Apenas admin altera roles internas.                           |

## Ordem de implementação recomendada

| Ordem | Fatia vertical                                 | Por que vem aqui                                               |
| ----: | ---------------------------------------------- | -------------------------------------------------------------- |
|     1 | Bootstrap do monorepo                          | Sem base executável, não há validação real.                    |
|     2 | User + auth + terms                            | Todas as demais regras dependem de identidade e consentimento. |
|     3 | RBAC + status de conta                         | Evita retrabalho de autorização em cada módulo.                |
|     4 | Perfis mínimos                                 | Permite completar onboarding e preparar candidatura.           |
|     5 | Vagas com moderação                            | Garante que o conteúdo publicado já nasça governado.           |
|     6 | Busca e candidatura                            | Entrega o principal valor para candidatos.                     |
|     7 | Gestão do contratante                          | Entrega valor operacional para quem publica vagas.             |
|     8 | Denúncias e auditoria completa                 | Fecha segurança operacional e rastreabilidade.                 |
|     9 | Polimento UX, acessibilidade e observabilidade | Eleva confiança antes de piloto público.                       |

## Backlog técnico inicial

| Item                                | Prioridade | Fase |
| ----------------------------------- | ---------: | ---- |
| Criar workspace com pnpm            |         P0 | 0    |
| Inicializar NestJS em `apps/api`    |         P0 | 0    |
| Inicializar Next.js em `apps/web`   |         P0 | 0    |
| Criar Docker Compose com PostgreSQL |         P0 | 0    |
| Configurar TypeORM com migrations   |         P0 | 0    |
| Configurar Swagger                  |         P0 | 0    |
| Criar health check                  |         P0 | 0    |
| Criar pipeline de lint/test/build   |         P0 | 0    |
| Implementar módulo `users`          |         P0 | 1    |
| Implementar módulo `auth`           |         P0 | 1    |
| Implementar refresh token rotativo  |         P0 | 1    |
| Implementar terms acceptance        |         P0 | 1    |
| Implementar guards RBAC             |         P0 | 1    |
| Implementar perfis                  |         P1 | 2    |
| Implementar uploads com adapter     |         P1 | 2    |
| Implementar vagas                   |         P1 | 3    |
| Implementar moderação de vagas      |         P1 | 3    |
| Implementar busca paginada          |         P1 | 3    |
| Implementar candidaturas            |         P1 | 3    |
| Implementar denúncias               |         P2 | 4    |
| Implementar painel admin            |         P2 | 4    |
| Implementar auditoria consultável   |         P2 | 4    |

## Riscos e mitigacoes

| Risco                                | Impacto | Mitigação                                                                          |
| ------------------------------------ | ------- | ---------------------------------------------------------------------------------- |
| Exposição indevida de currículos     | Alto    | Autorização por recurso, URLs temporárias, auditoria e testes de privacidade.      |
| Moderação insuficiente               | Alto    | Vagas pendentes por padrão e fila mínima de revisão no MVP.                        |
| Coleta excessiva de dados sensíveis  | Alto    | Dados opcionais, finalidade clara e corte de orientação sexual no MVP.             |
| Escopo administrativo crescer demais | Médio   | Admin mínimo: usuários, roles, status e auditoria.                                 |
| Busca ficar complexa cedo demais     | Médio   | Começar com PostgreSQL e evoluir depois.                                           |
| Frontend duplicar regra de segurança | Alto    | Backend como fonte de verdade; frontend apenas melhora UX.                         |
| Falta de testes nos fluxos críticos  | Alto    | Definição de pronto exige testes de auth, RBAC, vagas, candidaturas e privacidade. |

## Marco de piloto

O MVP está pronto para piloto fechado quando:

| Critério    | Esperado                                                               |
| ----------- | ---------------------------------------------------------------------- |
| Cadastro    | Candidato e contratante conseguem se cadastrar e completar onboarding. |
| Confiança   | E-mail, termos, RBAC e status de conta funcionam.                      |
| Vagas       | Contratante cria vaga e coordenador aprova/rejeita.                    |
| Descoberta  | Candidato busca vaga aprovada com filtros básicos.                     |
| Candidatura | Candidato se candidata uma única vez e acompanha status.               |
| Contratante | Contratante vê candidaturas das próprias vagas.                        |
| Moderação   | Usuários denunciam conteúdo e coordenador decide.                      |
| Auditoria   | Ações sensíveis ficam rastreáveis.                                     |
| Qualidade   | CI, testes críticos e health check estão ativos.                       |
| Privacidade | Currículo e dados completos respeitam visibilidade e consentimento.    |

## Recomendacao final

O melhor caminho e nao tentar construir todos os modulos em paralelo. A sequencia ideal e primeiro consolidar a base de identidade, consentimento e autorizacao; depois perfis; depois o fluxo principal de vaga moderada ate candidatura; e por fim governanca operacional com denuncias, administracao e auditoria consultavel.

Essa ordem protege o diferencial do produto: uma plataforma de empregabilidade que é útil, mas também segura, respeitosa e preparada para lidar com abuso desde o primeiro ciclo real de uso.
