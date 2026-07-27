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

Última verificação: 2026-07-26.

| Fase | Estado verificado | Próximo marco |
| --- | --- | --- |
| 0 — Fundação técnica | Concluída | reforçar gates de CI sem reabrir a fase |
| 1 — Identidade, termos e RBAC | Concluída | preservar os contratos durante as fases seguintes |
| 2 — Perfis e privacidade | Concluída | preservar a política deny-by-default |
| 3 — Vagas, busca e candidaturas | Concluída | endurecimento para piloto |
| 4 — Denúncias, administração e auditoria | Concluída | piloto fechado, E2E e operação |

As evidências e pendências detalhadas ficam em [`requirements/`](../requirements/README.md). Os
procedimentos reproduzíveis de setup, ambientes e segurança ficam em
[`runbooks/`](../runbooks/README.md).

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

| Entrega | Resultado esperado |
| --- | --- |
| CandidateProfile | Nome de exibição, pronomes opcionais, título, bio, localidade, preferências, skills, experiências, formação, links e ativação. |
| EmployerProfile | Tipo, responsável, contato, organização, segmento, localidade, descrição, site e verificação somente administrativa. |
| Visibilidade | `private`, `applications_only`, `verified_employers`, com `private` como padrão e autorização por recurso no backend. |
| Uploads | Avatar/logo/currículo privados, com assinatura real, MIME permitido, limite por finalidade, nome seguro e permissão de download. |
| Storage | Adapter local fora da pasta pública em desenvolvimento e adapter S3/R2 obrigatório em produção. |
| Auditoria mínima | Eventos para criação, campos alterados, ativação, visibilidade e arquivos, sem copiar os valores pessoais para o log. |
| Interface | Formulários responsivos para candidato e contratante, estados de carregamento/erro, progresso e explicações de privacidade. |

### Corte recomendado do MVP

Para acelerar sem ferir a privacidade, manter experiências, formação e skills como JSONB estruturado no primeiro ciclo. Normalizar em tabelas próprias somente quando houver necessidade de busca, filtros ou analytics mais finos.

### Política de acesso fechada

| Ator | `private` | `applications_only` | `verified_employers` |
| --- | --- | --- | --- |
| Titular do perfil | Acesso completo | Acesso completo | Acesso completo |
| Admin/coordenador | Acesso necessário para suporte e moderação | Acesso necessário para suporte e moderação | Acesso necessário para suporte e moderação |
| Contratante não verificado | Sem acesso | Sem acesso fora de uma candidatura própria | Sem acesso |
| Contratante verificado | Sem acesso | Somente por candidatura própria na Fase 3 | Acesso completo enquanto o perfil estiver ativo |

`applications_only` é deliberadamente restritivo nesta fase: como a relação de candidatura ainda
não existe, o modo não libera dados a contratantes. A Fase 3 deve adicionar a autorização pela
relação `Application`, sem transformar esse modo em uma listagem ampla.

### Critérios de aceite

| Critério | Validação |
| --- | --- |
| Perfil nasce protegido | Novo perfil de candidato usa `private` e permanece inacessível a terceiros. |
| Papel é respeitado | Candidato não altera perfil institucional; contratante não altera perfil de candidato. |
| Visibilidade é aplicada no backend | Contratante verificado só acessa perfil ativo com consentimento ampliado. |
| Arquivo não é público | Download autenticado repete a autorização e responde com `no-store` e `nosniff`. |
| Conteúdo do arquivo é validado | Currículo aceita PDF válido até 5 MB; imagens aceitam JPEG, PNG ou WebP válidos até 2 MB. |
| Produção usa storage remoto | Bootstrap de produção rejeita o driver local ou configuração S3/R2 incompleta. |
| Alterações são rastreáveis | Auditoria guarda ação e nomes dos campos alterados, nunca bio, currículo ou demais valores. |

### Testes obrigatorios

| Fluxo | Cobertura mínima |
| --- | --- |
| Perfil candidato | Criar, editar, ativar, desativar e alterar visibilidade. |
| Perfil contratante | Criar, editar, validar nome institucional condicional e impedir autoverificação. |
| Verificação institucional | Alterar tipo ou nome da organização revoga a verificação anterior e exige nova análise. |
| Privacidade | Bloquear papel incorreto, perfil privado, perfil inativo e contratante não verificado. |
| Upload | Rejeitar papel, finalidade, tamanho, MIME ou assinatura inválidos e testar download autorizado. |
| Auditoria | Confirmar eventos de campos e visibilidade sem valores pessoais no contexto. |

## Fase 3: Vagas, busca e candidaturas

Objetivo: entregar o primeiro fluxo central do produto de ponta a ponta: contratante envia uma vaga,
coordenação modera, candidato encontra a oportunidade, entende quais dados serão compartilhados e se
candidata, e ambas as partes acompanham o processo sem romper as regras de privacidade da Fase 2.

### Resultado de negócio

Ao final da fase, deve ser possível executar o caminho abaixo em ambiente de homologação:

```text
contratante cria vaga
  -> coordenação aprova ou devolve para ajustes
    -> vaga aprovada aparece na busca
      -> candidato revisa o compartilhamento e se candidata
        -> contratante acessa somente candidaturas das próprias vagas
          -> candidato e contratante acompanham um histórico de status
```

O marco não é apenas ter tabelas ou endpoints isolados. A fase termina quando esse fluxo vertical
funciona na API e na interface, com autorização negativa, auditoria e testes de concorrência nos
pontos críticos.

### Escopo fechado do MVP

| Incluído nesta fase | Fora desta fase |
| --- | --- |
| ciclo de vida da vaga e moderação prévia | recomendação de vagas por algoritmo |
| busca textual simples e filtros no PostgreSQL | Elasticsearch, OpenSearch ou outro motor externo |
| candidatura única com currículo preservado | integração com ATS, chat ou entrevista |
| acompanhamento de status pelas duas partes | notificações por e-mail, push ou tempo real |
| autorização por propriedade da vaga e candidatura | banco aberto ou busca global de candidatos |
| auditoria mínima de decisões e transições | painel consultável de auditoria e denúncias, previstos para a Fase 4 |

Para manter o corte controlado, `draft` e `reported` permanecem reservados no domínio, mas não terão
fluxo completo nesta fase. Criar uma vaga válida já a envia para `pending_review`; rascunho
persistente, denúncia e suspensão preventiva entram em iterações posteriores. Salvar o formulário
localmente no navegador pode ser avaliado como melhoria de UX, sem alterar o contrato do backend.

### Pré-condições preservadas

| Ator/área | Condição para executar ações sensíveis |
| --- | --- |
| Contratante | conta `active`, e-mail confirmado, termos e diretrizes atuais e `EmployerProfile` existente |
| Candidato | conta `active`, e-mail confirmado, termos atuais, `CandidateProfile` ativo e currículo PDF corrente |
| Coordenação | conta `active` e papel `coordinator` ou `admin` |
| Perfil do candidato | `private` continua negando acesso; a candidatura exige `applications_only` ou `verified_employers` |
| Verificação institucional | não é requisito para criar vaga; nesta fase ela continua afetando apenas a visibilidade ampliada de perfis |
| Backend | continua sendo a fonte de verdade para papel, propriedade, estado e visibilidade |

O passo de confirmação da candidatura deve explicar os dados compartilhados e bloquear o envio se o
perfil estiver `private`. A interface pode oferecer a alteração consciente para
`applications_only`, mas nunca deve mudar a visibilidade silenciosamente.

| Visibilidade do candidato | Contratante da vaga | Resultado ao tentar candidatar-se |
| --- | --- | --- |
| `private` | qualquer | bloqueia e explica como revisar a visibilidade |
| `applications_only` | verificado ou não | permite; o acesso nasce apenas para o dono daquela vaga |
| `verified_employers` | verificado | permite; preserva a visibilidade escolhida |
| `verified_employers` | não verificado | bloqueia até escolha explícita de `applications_only` |

### Entregas

| Entrega | Resultado esperado |
| --- | --- |
| Contratos compartilhados | Schemas e tipos para vaga, filtros, paginação, candidatura, decisões e status sem duplicação entre web e API. |
| `Job` | Criar, listar as próprias, editar com nova moderação, pausar, encerrar e republicar. |
| Moderação prévia | Fila paginada; aprovação, rejeição ou solicitação de ajustes com motivo e auditoria. |
| Busca e detalhe | Expor somente vagas `approved`, com campos públicos mínimos, filtros combináveis e paginação determinística. |
| `Application` | Criar uma única vez por candidato/vaga, preservar o currículo usado e manter histórico de status. |
| Privacidade por relação | Liberar `applications_only` apenas ao contratante dono da vaga vinculada à candidatura não cancelada. |
| Gestão do candidato | Listar as próprias candidaturas, visualizar histórico e cancelar dentro da transição permitida. |
| Gestão do contratante | Listar vagas próprias, candidaturas recebidas e alterar status apenas no fluxo permitido. |
| Interface | Busca, detalhe, confirmação, acompanhamento, gestão de vagas, fila de moderação e estados vazios/erro/carregamento. |
| Qualidade operacional | Migrations, índices, Swagger, logs estruturados, auditoria mínima e suíte de integração da fase. |

### Decisões de domínio

#### Vaga

O modelo da fase deve complementar `Job` com `area`, pois o filtro já é requisito, e definir um enum
compartilhado de senioridade. Campos textuais são texto simples no MVP; HTML fornecido pelo usuário
não deve ser renderizado.

| Regra | Decisão para o MVP |
| --- | --- |
| Área | campo obrigatório, normalizado para filtro e exibido como texto |
| Salário | informar `salaryMin` e `salaryMax`, com mínimo menor ou igual ao máximo, ou preencher `salaryHiddenReason` |
| Moderação | toda criação entra em `pending_review`; conteúdo aprovado nunca é alterado publicamente sem nova revisão |
| Edição aprovada | alteração de conteúdo move a vaga para `pending_review` e a remove da busca até nova aprovação |
| Solicitação de ajuste | adicionar `changes_requested` ao enum; o motivo é obrigatório e a correção volta para `pending_review` |
| Rejeição | `rejected` exige motivo e encerra aquela versão; uma nova tentativa deve ser criada como nova vaga |
| Motivo | `moderationReason` é obrigatório em `changes_requested`/`rejected` e limpo ao reenviar ou aprovar |
| Pausa | o dono pode mover `approved` para `paused`; retomada sem edição volta para `approved` |
| Encerramento | o dono pode encerrar vaga aprovada ou pausada; candidaturas existentes continuam consultáveis |
| Republicação | `closed` volta para `pending_review`; nunca retorna diretamente à busca |
| Limite antispam | limite configurável, inicialmente 3 vagas em `pending_review`, `changes_requested`, `approved` ou `paused` por contratante |

`changes_requested` deve ser incorporado aos tipos compartilhados, migration e documentação do
modelo. A decisão mantém diferença explícita entre conteúdo corrigível e rejeição definitiva e
atende à ação de solicitar ajustes prevista no RF-40.

#### Transições de vaga

| Estado atual | Ação | Autor | Próximo estado |
| --- | --- | --- | --- |
| criação | enviar vaga válida | contratante | `pending_review` |
| `pending_review` | aprovar | coordenação/admin | `approved` |
| `pending_review` | solicitar ajustes | coordenação/admin | `changes_requested` |
| `pending_review` | rejeitar | coordenação/admin | `rejected` |
| `changes_requested` | corrigir e reenviar | dono da vaga | `pending_review` |
| `approved` | editar conteúdo | dono da vaga | `pending_review` |
| `approved` | pausar | dono da vaga | `paused` |
| `approved` ou `paused` | encerrar | dono da vaga | `closed` |
| `paused` | retomar sem editar | dono da vaga | `approved` |
| `closed` | republicar | dono da vaga | `pending_review` |

Qualquer transição fora da tabela deve responder com erro de domínio e não pode produzir alteração
parcial. Decisões concorrentes de moderação e o limite de vagas devem ser protegidos por transação e
lock no PostgreSQL.

#### Candidatura

| Regra | Decisão para o MVP |
| --- | --- |
| Disponibilidade | somente vaga `approved` recebe nova candidatura |
| Elegibilidade | candidato ativo, verificado, com termos atuais, perfil ativo, currículo corrente e visibilidade compatível |
| Unicidade | constraint única no banco em `(jobId, candidateProfileId)`, além da validação amigável no service |
| Estado inicial | `submitted` |
| Mensagem | `coverMessage` opcional, em texto simples, com limite definido no schema |
| Currículo | cópia privada e imutável do PDF corrente para uma chave de storage da candidatura; nunca guardar URL pública |
| Perfil completo | somente dono da candidatura, dono da vaga e equipe autorizada; nenhum outro contratante pode inferir a relação |
| Cancelamento | candidato pode cancelar enquanto a vaga estiver `approved` e a candidatura não estiver terminal |
| Histórico | toda transição registra candidatura, autor, estado anterior, novo estado e data |

A Fase 2 substitui e remove a versão corrente do currículo. Por isso, apenas referenciar
`ProfileAsset` não preserva o documento efetivamente enviado. A migration deve criar metadados de
snapshot ligados à candidatura, e o storage deve copiar o arquivo para uma chave imutável. O
download repete a autorização na API e mantém `Cache-Control: private, no-store` e
`X-Content-Type-Options: nosniff`.

#### Transições de candidatura

| Estado atual | Ação | Autor | Próximo estado |
| --- | --- | --- | --- |
| criação | candidatar-se | candidato | `submitted` |
| `submitted` | iniciar análise | dono da vaga | `under_review` |
| `submitted` ou `under_review` | selecionar para próxima etapa | dono da vaga | `shortlisted` |
| `submitted`, `under_review` ou `shortlisted` | recusar | dono da vaga | `rejected` |
| `submitted`, `under_review` ou `shortlisted` | cancelar com vaga ativa | candidato titular | `cancelled` |

`rejected` e `cancelled` são terminais no MVP. O sistema não deve expor motivo interno de recusa ao
candidato sem uma política de conteúdo definida; o histórico exibido ao candidato mostra a
transição e a data.

### Política de acesso por recurso

| Operação | Autorização |
| --- | --- |
| Criar vaga | somente contratante que cumpra as pré-condições e o limite de vagas |
| Alterar vaga | somente dono; equipe interna usa ações explícitas de moderação |
| Ver vaga não pública | dono e equipe interna autorizada |
| Buscar/ver vaga pública | qualquer visitante, apenas quando `approved` |
| Moderar | coordenador/admin; nunca o próprio contratante |
| Criar candidatura | somente candidato titular do perfil elegível |
| Ver candidatura | candidato titular, dono da vaga associada e equipe interna autorizada |
| Mudar status da candidatura | dono da vaga, dentro da máquina de estados |
| Cancelar candidatura | candidato titular, dentro da máquina de estados |
| Baixar currículo enviado | candidato titular, dono da vaga de uma candidatura não cancelada e equipe interna autorizada |
| Abrir perfil `applications_only` | somente dono da vaga vinculada a uma candidatura não cancelada |

A listagem do contratante retorna dados mínimos para conduzir o processo e nunca serve como busca
global de candidatos. Dados de contato institucionais privados também não entram na resposta pública
da vaga.

### Contrato HTTP planejado

Os nomes podem ser refinados durante a implementação, mas a divisão de responsabilidade deve ser
preservada e documentada no Swagger.

| Método e rota | Papel/visibilidade | Resultado |
| --- | --- | --- |
| `POST /jobs` | contratante elegível | cria em `pending_review` |
| `GET /jobs/mine` | contratante | lista somente vagas próprias |
| `GET /jobs/mine/:id` | dono da vaga | detalhe administrativo |
| `PATCH /jobs/mine/:id` | dono da vaga | edita em estado permitido e reaplica moderação |
| `POST /jobs/mine/:id/pause` | dono da vaga | pausa vaga aprovada |
| `POST /jobs/mine/:id/resume` | dono da vaga | retoma vaga sem edição |
| `POST /jobs/mine/:id/close` | dono da vaga | encerra vaga |
| `POST /jobs/mine/:id/republish` | dono da vaga | reenvia vaga encerrada à moderação |
| `GET /moderation/jobs` | coordenador/admin | fila paginada por status |
| `POST /moderation/jobs/:id/decision` | coordenador/admin | aprova, solicita ajuste ou rejeita com motivo |
| `GET /jobs` | público | busca paginada de vagas aprovadas |
| `GET /jobs/:id` | público | detalhe de vaga aprovada |
| `POST /jobs/:id/applications` | candidato elegível | cria candidatura única |
| `GET /applications/mine` | candidato | acompanha as próprias candidaturas |
| `POST /applications/mine/:id/cancel` | candidato titular | cancela em estado permitido |
| `GET /jobs/mine/:id/applications` | dono da vaga | lista candidaturas recebidas |
| `PATCH /applications/:id/status` | dono da vaga | aplica transição permitida |
| `GET /applications/:id/resume` | partes autorizadas | download privado do snapshot |

Listagens usam `page` e `limit`, com limite máximo definido no backend, total quando necessário e
ordenação estável por data mais `id`. A busca pública aceita `q`, `area`, `location`, `workMode`,
`contractType` e `seniority`; filtros vazios ou desconhecidos devem falhar de forma previsível.

### Dados, índices e atomicidade

| Item | Planejamento |
| --- | --- |
| `jobs` | adicionar `area`, `changes_requested`, `moderationReason`, timestamps de moderação e índices para dono, estado, filtros e publicação |
| `applications` | FK para vaga e perfil, constraint única composta, status, mensagem e timestamps |
| `application_status_history` | FK da candidatura, autor, estado anterior/novo e data |
| `application_resume_snapshots` | FK única da candidatura, nome seguro, MIME, tamanho e `storageKey` privado |
| Busca | começar com PostgreSQL e texto normalizado; medir antes de adotar `pg_trgm`, full-text ou motor externo |
| Transações | criação da candidatura + snapshot + histórico; decisão de moderação; transição de status; verificação do limite |
| Remoção | exclusão física do snapshot somente conforme política de retenção aprovada; falhas de storage não podem deixar candidatura parcial |

O fluxo de candidatura deve copiar o arquivo antes da confirmação transacional e remover a cópia se
a transação falhar. Para evitar duplicidade em requisições concorrentes, a constraint do banco é a
garantia final; a API converte a violação em resposta de conflito compreensível.

A retenção do snapshot precisa ter finalidade, prazo e rotina de exclusão definidos antes do piloto.
Enquanto essa decisão de produto/LGPD não estiver registrada, a funcionalidade pode ser homologada
apenas com dados fictícios e não deve receber candidaturas reais.

### Interface planejada

| Público/ator | Telas e estados essenciais |
| --- | --- |
| Visitante/candidato | lista de vagas, filtros, paginação, detalhe, indisponibilidade e ação de candidatura |
| Candidato | revisão dos dados compartilhados, confirmação, sucesso, candidatura duplicada e acompanhamento de status |
| Contratante | lista própria, criação/edição, motivo de ajuste/rejeição, pausa/encerramento e candidaturas recebidas |
| Coordenação | fila pendente, detalhe integral da vaga, decisão com motivo obrigatório e confirmação |

Todas as telas precisam tratar carregamento, vazio, erro, sucesso, bloqueio e perda de permissão
quando aplicáveis. Busca e filtros devem funcionar por teclado, preservar rótulos acessíveis e não
usar apenas cor para comunicar estados. A confirmação da candidatura deve nomear o currículo e
explicar que uma cópia privada será vinculada ao processo.

### Plano de implementação em fatias verticais

| Ordem | Fatia | Entregável demonstrável | Dependência |
| ---: | --- | --- | --- |
| 1 | Contratos e migration | enums, schemas, entidades, constraints e migration reversível | Fase 2 estável |
| 2 | Vaga do contratante | criar, listar próprias, editar e aplicar limite com testes de propriedade | fatia 1 |
| 3 | Moderação | fila, decisão, motivo, auditoria e proteção contra corrida | fatia 2 |
| 4 | Busca pública | listagem/detalhe, filtros, paginação, índices e telas responsivas | vaga aprovada |
| 5 | Candidatura segura | unicidade, snapshot do currículo, histórico e autorização `applications_only` | busca + storage |
| 6 | Acompanhamento | listas do candidato/contratante, transições e cancelamento | candidatura |
| 7 | Endurecimento | integração completa, RBAC negativo, concorrência, acessibilidade, Swagger e documentação | todas as anteriores |

Cada fatia deve incluir backend, contrato compartilhado, interface mínima e teste proporcional ao
risco. Isso evita concluir toda a API antes de validar se o fluxo é compreensível na web.

### Histórias prioritárias

| História | Prioridade | Concluída quando |
| --- | --- | --- |
| US-05: criar vaga | P0 | contratante elegível cria e acompanha vaga `pending_review`; outro contratante não a altera |
| US-06: revisar vaga pendente | P0 | coordenação decide com motivo e evento auditável; decisão concorrente não sobrescreve estado |
| US-07: buscar vagas | P0 | somente vagas aprovadas aparecem com filtros combináveis e paginação estável |
| US-08: candidatar-se | P0 | candidatura única preserva currículo e concede acesso apenas ao dono da vaga |
| US-09: visualizar candidaturas recebidas | P0 | contratante vê somente candidaturas próprias e aplica apenas transições válidas |
| RF-35: acompanhar candidatura | P1 | candidato vê status e histórico mínimos e pode cancelar quando permitido |
| RF-25: pausar, encerrar e republicar | P1 | ações respeitam propriedade, estados e nova moderação |

### Critérios de aceite

| Critério | Validação |
| --- | --- |
| Vaga nasce moderada | criação válida retorna `pending_review` e não aparece na busca |
| Publicação é controlada | apenas coordenação/admin aprova; motivo é obrigatório para ajuste ou rejeição |
| Edição não burla revisão | alterar conteúdo aprovado remove a vaga da busca e volta a `pending_review` |
| Busca é segura | apenas campos públicos de vagas `approved` são retornados, com paginação obrigatória |
| Regra salarial é consistente | faixa válida ou justificativa; combinações ambíguas são rejeitadas |
| Candidatura é atômica | aplicação, histórico inicial e snapshot privado são confirmados juntos |
| Duplicidade é impossível | duas requisições concorrentes geram uma candidatura no máximo |
| Privacidade é relacional | somente o dono da vaga associada acessa perfil/currículo permitido; outro contratante recebe `403` ou `404` sem enumeração |
| Histórico é confiável | transições inválidas falham e toda alteração válida registra autor e data |
| Interface é completa | fluxos críticos têm estados acessíveis de carregamento, vazio, erro, bloqueio e sucesso |
| Contrato é reproduzível | Swagger, migrations e arquivo de evidências da fase refletem o comportamento entregue |

### Testes obrigatorios

| Fluxo | Cobertura mínima |
| --- | --- |
| Criação de vaga | papel, conta, e-mail, termos, perfil, limite, salário, campos e estado inicial |
| Propriedade | outro contratante não lê detalhe privado, edita, pausa, encerra ou lista candidaturas |
| Moderação | papéis positivo/negativo, motivo obrigatório, três decisões, auditoria e corrida entre decisões |
| Ciclo de vaga | edição aprovada, ajuste, pausa, retomada, encerramento, republicação e transições inválidas |
| Busca | somente `approved`, filtros isolados/combinados, paginação, ordenação, detalhe indisponível e DTO público |
| Candidatura | elegibilidade, vaga indisponível, perfil privado, ausência de currículo, estado inicial e duplicidade concorrente |
| Snapshot | cópia preservada após troca do currículo corrente, download autorizado, bloqueio de terceiros e headers seguros |
| Visibilidade | `applications_only` positivo para dono da vaga e negativo para outro contratante, vaga alheia e candidatura cancelada |
| Status | transições válidas, terminais, autor, histórico, candidato sem permissão e contratante sem propriedade |
| Interface | validação, teclado, foco, responsividade, carregamento, vazio, erro, conflito e confirmação de compartilhamento |
| Regressão | autenticação, termos, RBAC, perfis, storage e política deny-by-default das fases anteriores |

### Auditoria e observabilidade mínima

| Evento | Metadados permitidos |
| --- | --- |
| `job.created` / `job.updated` | ID, estado e nomes dos campos alterados |
| `job.moderation_decided` | ID, decisão, ator e código de motivo; texto completo fica no recurso, não no log |
| `job.paused` / `job.closed` / `job.republished` | ID, estado anterior e novo |
| `application.submitted` | IDs da vaga e candidatura, nunca currículo ou mensagem |
| `application.status_changed` | IDs, estado anterior/novo e autor |
| `application.cancelled` | IDs e autor |
| `application.resume_downloaded` | IDs da candidatura, ator e finalidade de acesso |

Logs estruturados devem incluir `requestId`, rota, status e duração, sem título da vaga, mensagem de
apresentação, nome de candidato, currículo, e-mail ou dados sensíveis. Falhas de busca, candidatura,
storage e moderação precisam chegar ao exception handler global.

### Riscos específicos e mitigação

| Risco | Mitigação |
| --- | --- |
| edição publicada contornar moderação | toda mudança de conteúdo volta a `pending_review` |
| enumeração de candidatos ou vagas privadas | autorização por recurso e resposta sem detalhes sobre a existência alheia |
| currículo mudar depois do envio | snapshot privado e imutável por candidatura |
| candidatura ou decisão duplicada por corrida | constraints, transações e lock no estado atual |
| busca degradar com filtros | paginação, índices, dataset de teste e medição antes de trocar de tecnologia |
| escopo crescer para um ATS completo | limitar estados, não incluir chat, automação, ranking ou integrações |
| logs copiarem conteúdo pessoal | allowlist de metadados e testes sobre auditoria/logs |

### Definição de pronto da fase

A Fase 3 será considerada concluída somente quando:

1. o fluxo `criar -> moderar -> buscar -> candidatar -> acompanhar` funcionar de ponta a ponta;
2. as histórias P0 estiverem atendidas e as transições P1 previstas no ciclo da vaga estiverem
   implementadas;
3. migrations executarem e reverterem em banco limpo, com constraints e índices revisados;
4. testes unitários, integração, frontend, typecheck, lint e build passarem;
5. casos negativos de papel, propriedade, visibilidade, estado e concorrência estiverem cobertos;
6. Swagger e contratos compartilhados refletirem as respostas reais;
7. um registro `requirements/etapa-3-vagas-busca-candidaturas.md` reunir escopo, decisões,
   rastreabilidade, evidências e pendências;
8. a política de retenção do currículo da candidatura estiver aprovada e possuir rotina de exclusão
   verificável;
9. os comandos reproduzíveis `pnpm test`, `pnpm test:integration`, `pnpm typecheck`, `pnpm lint` e
   `pnpm build` passarem sem reabrir garantias das Fases 1 e 2.

## Fase 4: Denúncias, administração e auditoria

Objetivo: fechar o ciclo de governança mínima da plataforma sem transformar o painel interno em
uma porta de acesso irrestrito a dados pessoais. A fase deve permitir que pessoas autenticadas
relatem abuso, que a equipe trate cada caso com prioridade e histórico, e que somente admins
controlem contas e consultem a trilha transversal de auditoria.

### Resultado de negócio

Ao final da fase, a plataforma deve suportar o seguinte fluxo em homologação:

```text
pessoa autenticada denuncia um recurso que pode acessar
  -> recebe protocolo e acompanha somente o status
  -> coordenação recebe a fila ordenada por risco e chegada
  -> decisão motivada altera o estado de forma atômica
  -> conteúdo confirmado pode ser retirado da área pública
  -> admin controla acesso e consulta os eventos permitidos
```

O denunciante não recebe notas internas, descrição armazenada, prioridade, identidade de quem
moderou ou justificativa operacional. Essa separação reduz exposição acidental e evita que o canal
de acompanhamento se torne uma cópia do processo interno.

### Escopo funcional fechado

| Capacidade | Resultado esperado |
| --- | --- |
| Denúncia | Pessoa autenticada denuncia vaga, perfil, usuário ou candidatura que esteja autorizada a referenciar. |
| Antiduplicidade | Existe no máximo uma denúncia `open` ou `in_review` por denunciante, tipo e recurso. |
| Acompanhamento | Autor consulta protocolo, alvo, categoria, status e datas; o relato completo permanece restrito. |
| Triagem | Prioridade inicial deriva da categoria e pode ser ajustada pela equipe com auditoria. |
| Fila | Coordenação/admin filtra por estado, prioridade e tipo; ordenação usa prioridade e antiguidade. |
| Decisão | Toda ação exige motivo, autor, estado anterior/novo e data em histórico imutável. |
| Conteúdo público | Vaga confirmada como problemática sai imediatamente da busca e só retorna por ação explícita. |
| Administração | Admin lista usuários e altera papel ou estado com motivo obrigatório e revogação de sessão. |
| Auditoria consultável | Admin filtra eventos por autor, titular, ação e período sem receber IP, user-agent ou conteúdo sensível. |
| Interface | Candidato/contratante acompanham relatos; equipe modera; admin gerencia contas e auditoria. |

Ficam fora do MVP: anexos em denúncias, chat entre denunciante e equipe, SLA automático,
notificações externas, denúncias anônimas, apelação, banimento automático, classificação por IA,
exportação ampla de auditoria e dashboards analíticos.

### Política de acesso por recurso

| Operação | Autorização |
| --- | --- |
| Criar denúncia | pessoa autenticada, e-mail verificado e termos aceitos; o recurso precisa existir dentro do seu alcance |
| Denunciar vaga | vaga pública/pausada/sinalizada ou vaga própria; equipe pode referenciar qualquer vaga moderável |
| Denunciar perfil | titular, equipe ou ator que já possua acesso legítimo ao perfil |
| Denunciar usuário | conta existente; o autor não pode denunciar a própria conta |
| Denunciar candidatura | candidato titular, dono da vaga ou equipe; terceiros recebem resposta sem enumeração |
| Ver denúncia própria | somente o autor, em DTO reduzido |
| Ver relato e histórico interno | coordenador/admin |
| Alterar prioridade e decidir | coordenador/admin |
| Listar e alterar contas | somente admin |
| Consultar auditoria | somente admin |

Os guards de papel são apenas a primeira barreira. A resolução do alvo deve repetir autorização por
recurso e retornar `404` quando expor a existência do objeto criaria enumeração indevida.

### Estados e decisões

#### Máquina de estados da denúncia

| Estado atual | Ação | Próximo estado | Observação |
| --- | --- | --- | --- |
| `open` | `start_review` | `in_review` | reserva sem criar uma decisão final |
| `open` ou `in_review` | `resolve` | `resolved` | confirma tratamento sem ação automática sobre o recurso |
| `open` ou `in_review` | `dismiss` | `dismissed` | encerra sem ação material |
| `open` ou `in_review` | `hide_job` | `resolved` | muda a vaga `approved`/`paused` para `reported` |
| `resolved` após `hide_job` | `restore_job` | `dismissed` | restaura a vaga como `approved` e registra nova decisão |

`resolved` e `dismissed` são terminais, exceto pela restauração explícita de uma vaga antes retirada.
Decisões concorrentes devem serializar pelo registro da denúncia; somente uma decisão final vence e
a outra recebe conflito. O motivo possui entre 10 e 1.000 caracteres e nunca é copiado para a
auditoria transversal.

#### Prioridade

| Prioridade | Uso |
| --- | --- |
| `urgent` | risco imediato definido manualmente pela equipe |
| `high` | discriminação, assédio, privacidade ou fraude na triagem inicial |
| `normal` | conteúdo inadequado ou outro motivo |
| `low` | spam sem risco imediato |

A prioridade organiza trabalho, não determina culpabilidade nem executa sanções automáticas.

### Administração segura de contas

| Ação | Regra |
| --- | --- |
| Listar | paginação e filtros por nome/e-mail, papel e status |
| Alterar papel | somente admin, motivo obrigatório e incremento de `authVersion` |
| Suspender/desativar | somente admin, motivo obrigatório, incremento de `authVersion` e revogação de refresh tokens ativos |
| Reativar | somente admin; conta sem e-mail verificado não pode voltar a `active` |
| Autoproteção | admin não pode remover o próprio papel administrativo nem suspender/desativar a própria conta |

O frontend melhora a experiência, mas a proteção real permanece no serviço transacional. A
resposta administrativa nunca inclui hash de senha, tokens ou dados de perfil.

### Contrato HTTP

| Método e rota | Papel | Resultado |
| --- | --- | --- |
| `POST /reports` | autenticado | cria denúncia validada e retorna visão reduzida |
| `GET /reports/mine` | autenticado | lista denúncias próprias por status, com paginação |
| `GET /moderation/reports` | coordenação/admin | lista fila por status, prioridade e tipo de alvo |
| `GET /moderation/reports/:id` | coordenação/admin | retorna relato e histórico completo |
| `PATCH /moderation/reports/:id/priority` | coordenação/admin | altera prioridade com evento de auditoria |
| `POST /moderation/reports/:id/decision` | coordenação/admin | registra transição motivada e possível ação sobre vaga |
| `GET /users` | admin | lista contas com filtros e paginação |
| `PATCH /users/:id/role` | admin | altera papel com motivo |
| `PATCH /users/:id/status` | admin | suspende, desativa ou reativa com motivo |
| `GET /audit-events` | admin | filtra eventos por autor, titular, ação e período |

Entradas usam DTOs com allowlist, UUID validado, limites de tamanho e paginação comum. Respostas web
são validadas pelos contratos Zod de `packages/shared`.

### Dados, constraints e índices

| Item | Decisão |
| --- | --- |
| `reports` | denunciante, titular afetado, alvo polimórfico, categoria, relato, status, prioridade e datas |
| `moderation_decisions` | FK da denúncia, autor, ação, motivo, estado anterior/novo e data |
| Unicidade ativa | índice parcial por denunciante + tipo + alvo em `open`/`in_review` |
| Fila | índice por estado + prioridade + criação + ID |
| Histórico | índice por denúncia + criação + ID |
| Alvo polimórfico | validação de existência e autorização é feita no serviço antes da gravação |
| Exclusão | decisões são removidas apenas com a denúncia; usuários referenciados usam `RESTRICT` |
| Transações | criação + auditoria, prioridade + auditoria, decisão + ação no recurso + auditoria |

O campo `targetUserId` materializa o titular afetado para autorização, investigação e auditoria sem
precisar copiar dados do recurso. O conteúdo do relato permanece na tabela de domínio, não no
`AuditEvent`.

### Privacidade, segurança e observabilidade

| Risco | Controle |
| --- | --- |
| Relato vazar ao autor ou a outro usuário | DTO público reduzido e endpoints internos com RBAC |
| Denúncia revelar recurso privado | resolução por recurso e resposta `404` sem enumeração |
| Spam de denúncias | unicidade parcial no banco e resposta `409` compreensível |
| Duas decisões finais | lock pessimista e máquina de estados transacional |
| Conta suspensa manter sessão | `authVersion` + revogação de refresh tokens |
| Admin bloquear a própria operação | proteção de auto-rebaixamento e autobloqueio |
| Auditoria virar repositório de dados pessoais | allowlist de metadados e DTO sem IP/user-agent |
| Vaga denunciada continuar pública | mudança atômica para `reported` e remoção de `publishedAt` |

Eventos mínimos:

| Evento | Metadados permitidos |
| --- | --- |
| `report.created` | IDs, tipo do alvo e categoria; nunca descrição |
| `report.priority_changed` | ID e prioridade anterior/nova |
| `report.decision_recorded` | IDs, ação e estados; nunca motivo completo |
| `job.reported` / `job.restored` | IDs e estado anterior quando aplicável |
| `user.role_changed` | papéis anterior/novo e motivo administrativo |
| `user.suspended` / `user.disabled` / `user.reactivated` | estados anterior/novo e motivo administrativo |

Motivos administrativos são mantidos na auditoria por exigência de responsabilização interna; sua
consulta é exclusiva de admin e deve seguir política de retenção e necessidade de acesso. Relatos,
mensagens de candidatura e currículos nunca entram nesse contexto.

### Interface e acessibilidade

| Ator | Experiência |
| --- | --- |
| Pessoa autenticada | controle contextual de denúncia e página “Minhas denúncias” com status legível |
| Coordenação | fila com filtros, prioridade textual, relato, histórico e ações motivadas |
| Admin | visão geral, gestão de usuários, fila de denúncias e busca de auditoria |

Formulários precisam de rótulos explícitos, mensagem além de cor, foco navegável, limites visíveis
quando relevantes e estados de carregamento, vazio, erro e sucesso. A linguagem deve explicar que o
canal é confidencial para a equipe sem prometer anonimato.

### Plano de implementação em fatias verticais

| Ordem | Fatia | Entregável demonstrável |
| ---: | --- | --- |
| 1 | Contratos e banco | enums, schemas, entidades, constraints, índices e migration reversível |
| 2 | Criação e acompanhamento | denúncia autorizada, antiduplicidade e resposta limitada ao autor |
| 3 | Fila e decisões | priorização, máquina de estados, concorrência e histórico |
| 4 | Ação sobre conteúdo | retirada e restauração rastreável de vaga pública |
| 5 | Administração | consulta e alteração segura de papéis/status com revogação |
| 6 | Auditoria | endpoint restrito, filtros, allowlist de resposta e interface |
| 7 | Endurecimento | RBAC negativo, regressão, acessibilidade, Swagger e evidências |

### Histórias prioritárias

| História | Prioridade | Concluída quando |
| --- | --- | --- |
| RF-36: denunciar conteúdo | P0 | ator autorizado cria uma denúncia única e recebe protocolo limitado |
| RF-37: analisar denúncia | P0 | coordenação prioriza e decide com motivo e histórico |
| RF-38: retirar conteúdo | P0 | vaga confirmada sai da busca na mesma transação da decisão |
| RF-39: administrar conta | P0 | somente admin altera papel/status e sessões antigas perdem validade |
| RF-40: consultar auditoria | P1 | somente admin filtra metadata permitida sem conteúdo sensível |
| RF-41: acompanhar relato | P1 | autor vê estado e datas sem detalhes internos |

### Critérios de aceite

| Critério | Validação |
| --- | --- |
| Recurso é autorizado | alvo inexistente ou fora do alcance não pode ser usado para inferência |
| Autor recebe visão mínima | resposta própria omite relato, prioridade e decisões |
| Denúncia ativa é única | corrida ou repetição para o mesmo alvo retorna no máximo um registro ativo |
| Fila é previsível | filtros validados e ordenação por prioridade, data e ID |
| Decisão é rastreável | motivo, autor, estados e data são preservados no histórico |
| Concorrência é segura | decisões finais simultâneas resultam em um sucesso e um conflito |
| Conteúdo é governado | `hide_job` remove a vaga pública; `restore_job` exige estado compatível |
| Conta é protegida | apenas admin altera acesso; autobloqueio administrativo falha |
| Suspensão é efetiva | refresh tokens são revogados e access tokens antigos falham por versão |
| Auditoria é mínima | resposta não contém IP, user-agent, relato, currículo ou mensagem |
| Interface fecha o fluxo | denúncia, acompanhamento, moderação, usuários e auditoria são operáveis |
| Banco é reproduzível | migration sobe e desce em PostgreSQL limpo |

### Testes obrigatórios

| Fluxo | Cobertura mínima |
| --- | --- |
| Denúncia | autenticação, recurso, descrição, autoalvo, visão do autor e duplicidade |
| Autorização | papéis positivos/negativos e alvos privados de cada tipo |
| Fila | filtros, prioridade inicial/manual, ordenação e DTO interno |
| Decisão | motivo, transições, terminais, ação incompatível e auditoria |
| Concorrência | duas decisões finais sobre a mesma denúncia |
| Conteúdo | vaga removida da busca e restauração controlada |
| Admin | listagem, filtros, alteração de papel/status, motivo e autoproteção |
| Sessão | suspensão/desativação invalida tokens ativos |
| Auditoria | RBAC, filtros por autor/titular/ação/período e ausência de campos proibidos |
| Interface | teclado, rótulos, estados, responsividade e feedback sem depender apenas de cor |
| Regressão | identidade, termos, perfis, vagas, candidaturas, storage e privacidade |

### Definição de pronto da fase

A Fase 4 será considerada concluída somente quando:

1. denúncia, acompanhamento, fila, decisão, administração e auditoria funcionarem de ponta a ponta;
2. migrations executarem e reverterem em banco limpo;
3. papéis, propriedade, estados terminais e concorrência tiverem casos negativos automatizados;
4. a resposta do autor e a auditoria tiverem testes contra exposição de dados sensíveis;
5. alteração de papel/status revogar permissões ou sessões conforme a mudança;
6. telas críticas tratarem carregamento, vazio, erro e sucesso de forma acessível;
7. Swagger e contratos compartilhados refletirem as respostas reais;
8. `requirements/etapa-4-governanca.md` reunir rastreabilidade, comandos e limitações;
9. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
   `pnpm test:integration` e `pnpm build` passarem.

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
