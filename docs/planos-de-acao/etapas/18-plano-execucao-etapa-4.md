# Plano de execução da etapa 4 — LGPD, consistência e operação

- Plano de origem:
  [`13-plano-melhorias-seguranca-fluxo.md`](../13-plano-melhorias-seguranca-fluxo.md)
- Data-base da análise: 2026-07-26
- Estado: implementação técnica inicial concluída; ativações dependentes de governança pendente
- Pré-requisitos técnicos: etapas 0 a 3 concluídas e seus gates novamente verdes na revisão de
  início

## 1. Resultado esperado

A etapa 4 deve converter políticas e intenções em capacidades que possam ser usadas, testadas,
auditadas e recuperadas. Ao final, o Vale deve:

1. conhecer os dados pessoais que trata, por que os trata, onde estão, quem os recebe e até quando
   devem existir;
2. permitir que o titular confirme o tratamento, acesse e corrija seus dados por um caminho seguro;
3. executar exportação, revogação de consentimento opcional e exclusão ou anonimização sem expor
   dados de terceiros;
4. manter cadastro, aceites, tokens e notificações consistentes mesmo quando banco, e-mail, storage
   ou rede falham;
5. tornar criações sujeitas a retry idempotentes e registrar transições de estado com ator, versão e
   motivo;
6. operar PostgreSQL, backups, migrations, logs, métricas, alertas e incidentes com evidência
   verificável;
7. provar em um ambiente isolado que uma restauração funciona e que ela não ressuscita dados já
   eliminados.

Esta etapa não é apenas um conjunto de endpoints. Ela inclui decisões de governança, migrations,
workers, interface, contratos compartilhados, controles de infraestrutura, testes de falha e
runbooks.

## 2. Limites e premissas

### 2.1 Dentro do escopo

- inventário de tratamento e matriz de retenção;
- canal autenticado e canal assistido para direitos do titular;
- confirmação, acesso, exportação, correção, exclusão, anonimização e revogação de consentimentos
  opcionais;
- reautenticação para ações críticas;
- cadastro transacional e notificações por outbox;
- idempotência para criação de vaga e candidatura;
- histórico consistente de transições relevantes;
- TLS do banco e HTTPS para dependências remotas;
- backup, restauração, expansão/contração de migrations e replay de eliminações;
- logs JSON, correlação, métricas, alertas e runbooks;
- testes unitários, integração, concorrência, falha e segurança necessários para esses fluxos.

### 2.2 Fora do escopo

- inventar base legal, prazo de retenção ou justificativa jurídica sem aprovação responsável;
- realizar peticionamento ou comunicação real à ANPD;
- contratar ou configurar recursos remotos sem autorização específica;
- substituir o monólito modular por microserviços;
- criar um data warehouse, plataforma genérica de workflow ou barramento distribuído;
- executar o redesenho geral de UX e a suíte E2E ampla da etapa 5;
- prometer portabilidade interoperável além do formato estruturado que vier a ser aprovado;
- apagar dados mantidos por obrigação legal ou exercício regular de direitos sem decisão
  documentada.

### 2.3 Referência legal, não parecer jurídico

O desenho deve ser revisado pelo responsável jurídico e pelo controlador/encarregado antes de
ativar exportação e exclusão para dados reais. Como base mínima:

- a [LGPD, arts. 16, 18 e 19](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
  trata da conservação após o término, dos direitos do titular e da confirmação ou acesso em formato
  simplificado ou completo;
- a
  [orientação da ANPD sobre direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares)
  registra confirmação e acesso, correção, bloqueio, exclusão, portabilidade, eliminação e revogação
  de consentimento;
- a
  [orientação da ANPD sobre incidentes](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis)
  deve fundamentar o runbook de avaliação e comunicação de incidentes;
- o
  [guia de agentes de tratamento e encarregado](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado)
  deve ser usado para registrar os papéis institucionais.

O produto deve aceitar que um pedido não possa ser executado imediatamente. Nesse caso, o fluxo
precisa registrar e comunicar uma razão de fato ou de direito aprovada, sem usar um erro técnico
genérico como resposta.

Para confirmação e acesso, o desenho inicial deve oferecer uma resposta simplificada imediatamente
e tratar a declaração completa no prazo de até 15 dias contado do pedido, conforme o art. 19
consultado. O Vale deve adotar um prazo operacional interno menor para permitir revisão e entrega,
e confirmar novamente a regulamentação antes de ativar o fluxo.

## 3. Diagnóstico da base atual

| Área | Base preservada | Lacuna da etapa 4 |
| --- | --- | --- |
| cadastro | valida versões legais e cria usuário, aceites, token de verificação e sessão | as gravações atravessam operações separadas e podem deixar conta parcial |
| e-mail | adapters local e HTTP; falha inicial de verificação permite reenvio | não há outbox, retry persistido, deduplicação, fila morta ou telemetria de atraso |
| termos | aceite idempotente por usuário, documento e versão | aceita sempre pelo repositório global e não participa da transação do cadastro |
| sessão | refresh rotativo, revogação e `authVersion` | exclusão de conta não possui estado próprio nem política de acesso limitada |
| perfil | titular corrige a maior parte dos campos e arquivos são privados | e-mail e dados da conta não têm fluxo de correção completo |
| exportação | contratos por audiência já minimizam respostas comuns | não há inventário, agregador, artefato privado nem contrato de exportação |
| exclusão | `User` possui `deletedAt` e alguns filhos usam cascade | FKs `RESTRICT`, storage, relatórios, candidaturas e auditoria impedem exclusão ingênua |
| consentimento | versões de termos, privacidade e diretrizes ficam registradas | aceite obrigatório está misturado conceitualmente com consentimentos opcionais futuros |
| candidatura | grava snapshot e histórico de status | retry pode repetir efeitos antes de o cliente saber o resultado |
| vaga | criação e auditoria já existem | criação não aceita chave de idempotência nem possui histórico imutável de todo estado |
| operação | health checks, migrations e validação de ambiente existem | banco não configura TLS, Compose publica em todas as interfaces e não há backup comprovado |
| observabilidade | Nest `Logger` e eventos de auditoria registram partes do fluxo | faltam JSON, `requestId`, métricas reais, dashboards, alertas e política de retenção |

Principais pontos de código afetados:

- `apps/api/src/auth/auth.service.ts`: cadastro, tokens, reset e envio direto;
- `apps/api/src/terms/terms.service.ts`: aceite sem `EntityManager`;
- `apps/api/src/email/*`: envio síncrono sem outbox;
- `apps/api/src/users/user.entity.ts`: estados e tombstone da conta;
- `apps/api/src/jobs/*`: idempotência, histórico e snapshots;
- `apps/api/src/profiles/*`: correção, exportação e eliminação de arquivos;
- `apps/api/src/reports/*` e `apps/api/src/audit/*`: retenção e anonimização com preservação de
  evidência;
- `apps/api/src/database/*`: TLS, migrations e restore;
- `apps/web/lib/api.ts` e uma nova área de conta/privacidade: contratos e interface;
- `docker-compose.yml`, `.env.example` e `docs/runbooks/*`: operação.

## 4. Gates de decisão antes do código destrutivo

Nenhuma migration que elimine, anonimize ou imponha prazo definitivo deve ser escrita antes dos
gates abaixo. As decisões devem ficar versionadas, com responsável, data de aprovação e próxima
revisão.

| ID | Decisão necessária | Saída verificável | Bloqueia |
| --- | --- | --- | --- |
| D-01 | identificar controlador, operadores, suboperadores, encarregado ou canal equivalente | RACI e cadastro de fornecedores | publicação do canal e incidentes |
| D-02 | atribuir finalidade e base legal a cada operação | inventário aprovado por dado e fluxo | exportação e exclusão |
| D-03 | definir retenção e destino final por conjunto de dados | matriz com prazo, gatilho, exceção e owner | scheduler de eliminação |
| D-04 | definir como validar titular e representante | política de identidade, procuração e recuperação | canal assistido |
| D-05 | definir período de segurança da exclusão e comportamento da conta durante a espera | estado de conta, prazo e regra de cancelamento | fluxo de exclusão |
| D-06 | definir conteúdo da cópia completa e campos de terceiros a redigir | schema e exemplos aprovados de exportação | exportação pública |
| D-07 | identificar finalidades realmente opcionais baseadas em consentimento | catálogo de propósito, versão e efeito da revogação | tela de consentimentos |
| D-08 | aprovar RPO, RTO, retenção, criptografia e região dos backups | política de continuidade | escolha do mecanismo e restore |
| D-09 | aprovar provedor de logs, métricas, alertas e retenção | diagrama de fluxo e tabela de acesso | telemetria remota |
| D-10 | revisar contratos de e-mail, storage, hospedagem e monitoramento | registro de operadores e transferências | produção com dados reais |
| D-11 | definir papéis e escalação de incidente | contatos primário/secundário e autoridade de decisão | runbook de incidente |
| D-12 | definir validade das chaves de idempotência e artefatos de exportação | TTLs aprovados e justificados | jobs de limpeza |

Valores desconhecidos devem aparecer como `PENDENTE_APROVACAO`; não devem receber um número
silenciosamente escolhido no código. Limites puramente técnicos e reversíveis podem ter um padrão
conservador, desde que sejam documentados e diferentes de uma retenção jurídica.

## 5. Arquitetura alvo

O monólito modular continua sendo a unidade de deploy. As novas capacidades devem usar PostgreSQL,
os adapters de storage e o processo NestJS já existentes.

```text
Next.js
  -> API autenticada + CSRF
    -> PrivacyModule
      -> pedidos, exportação, correção, consentimento e exclusão
    -> IdempotencyService
      -> criação de vaga e candidatura
    -> transação de domínio
      -> tabelas de negócio
      -> histórico/auditoria
      -> OutboxMessage
  -> workers no mesmo artefato NestJS
    -> dispatcher de e-mail
    -> gerador de exportação
    -> executor de exclusão/anonimização
    -> limpeza de artefatos e registros transitórios
  -> PostgreSQL + storage privado
  -> logs JSON, métricas e alertas
```

### 5.1 Módulos propostos

| Módulo | Responsabilidade | Não deve fazer |
| --- | --- | --- |
| `PrivacyModule` | pedidos do titular, exportação, consentimentos e ciclo de exclusão | decidir sozinho base legal ou prazo |
| `OutboxModule` | persistir, reservar, enviar, repetir e encerrar mensagens | conter token ou senha em texto puro |
| `IdempotencyModule` | validar chave, fingerprint e replay seguro de resposta | usar chave global sem escopo de ator e rota |
| `ObservabilityModule` | correlação, logs, métricas e health de workers | registrar payload pessoal ou labels de alta cardinalidade |
| `AuthModule` | cadastro atômico, reautenticação e revogação | chamar provedor dentro da transação |
| módulos de domínio | exportar e anonimizar seus próprios dados por contrato interno | permitir que um agregador consulte tabelas arbitrariamente |

Cada domínio deve implementar interfaces pequenas, por exemplo:

```text
PersonalDataContributor
  -> exportForSubject(userId)
  -> planErasure(userId)
  -> executeErasureStep(requestId, userId)
```

O agregador de privacidade compõe resultados explicitamente. Não deve usar reflexão de entidades ou
`SELECT *`, pois uma coluna nova poderia passar a ser exportada ou retida sem revisão.

## 6. Modelo de dados proposto

As migrations devem ser aditivas e divididas por capacidade. Os nomes abaixo são conceituais; o
prefixo numérico deve usar o próximo valor livre quando a etapa começar.

### 6.1 Pedidos do titular

`data_subject_requests`:

| Campo | Regra |
| --- | --- |
| `id` | UUID público usado como protocolo |
| `subject_user_id` | titular autenticado; aponta para o tombstone após anonimização |
| `type` | `access`, `export`, `correction`, `deletion`, `consent_revocation` ou `other` |
| `status` | máquina de estados fechada |
| `source` | `self_service` ou `assisted` |
| `requested_at` | início do SLA |
| `identity_verified_at` | evidência de reautenticação ou validação assistida |
| `due_at` | prazo operacional derivado da política aprovada |
| `scheduled_for` | execução futura quando aplicável |
| `completed_at` | conclusão técnica e operacional |
| `reason_code` | código controlado para recusa, retenção ou pendência; sem texto sensível |
| `external_reference` | protocolo de suporte opcional, sem copiar a conversa |
| `state_version` | controle de concorrência |

Estados mínimos:

```text
requested
  -> identity_pending
  -> scheduled
  -> processing
  -> completed
  -> partially_completed
  -> rejected
  -> cancelled
  -> failed_retryable
```

`data_subject_request_events` deve ser imutável e guardar pedido, transição, ator ou sistema, versão,
motivo controlado e data. Conteúdo livre do atendimento permanece no sistema de atendimento
aprovado, não no evento técnico.

### 6.2 Exportações

`data_export_artifacts` deve guardar somente:

- pedido;
- chave privada do objeto;
- hash SHA-256, tamanho e versão do schema;
- criação, expiração, primeiro download e eliminação;
- estado de geração;
- código de erro controlado.

O arquivo fica em prefixo privado próprio, criptografado, sem URL permanente e com lifecycle como
segunda barreira. O banco nunca armazena o conteúdo da exportação.

### 6.3 Consentimentos opcionais

`user_consents` deve registrar:

- usuário;
- código estável da finalidade;
- versão do texto específico;
- instante e origem da manifestação;
- instante e motivo controlado da revogação;
- vínculo opcional com o pedido que causou a revogação.

Uma constraint deve impedir dois consentimentos ativos para o mesmo usuário, finalidade e versão.
Termos de uso, aviso de privacidade e diretriz obrigatória continuam em `term_acceptances`; marcar
esses documentos como lidos ou aceitos não deve ser apresentado como consentimento opcional.

### 6.4 Outbox

`outbox_messages` deve incluir:

- ID do evento;
- tipo e versão do template;
- agregado e ID relacionado;
- chave de deduplicação única;
- payload cifrado e versão da chave;
- estado `pending`, `processing`, `sent`, `retry_wait` ou `dead`;
- tentativas, próxima execução, lease, criação, envio e expiração;
- código resumido do último erro;
- `requestId` de origem, quando houver.

E-mail, nome e tokens de verificação ou reset são dados transitórios. O payload deve ser cifrado com
chave externa ao banco e removido após envio mais a janela operacional aprovada. Hash de token
continua na tabela de tokens; o valor utilizável nunca fica em JSON aberto, log, métrica ou contexto
de auditoria.

### 6.5 Idempotência

`idempotency_records` deve conter:

- hash da chave fornecida pelo cliente;
- usuário, método e rota normalizada;
- hash canônico da entrada;
- estado `processing`, `completed` ou `failed_retryable`;
- status HTTP e referência mínima ao recurso criado;
- versão do contrato;
- início, conclusão e expiração;
- lease para recuperar execução interrompida.

A unicidade é por usuário, operação e hash da chave. A mesma chave com outro corpo deve retornar
conflito estável. A tabela não deve persistir a senha, corpo bruto, currículo ou resposta completa
com dados pessoais.

### 6.6 Transições e tombstone

- adicionar `state_version` aos agregados que recebem transições concorrentes;
- criar `job_status_history`, pois auditoria não substitui histórico de domínio;
- ampliar `application_status_history` com motivo controlado e versão;
- preservar `moderation_decisions` como histórico de denúncias;
- manter alterações administrativas no `audit_events`, com versão da conta no contexto permitido;
- adicionar ao usuário os estados necessários ao ciclo aprovado, por exemplo
  `deletion_pending` e `deleted`, somente após D-05;
- criar um ledger mínimo de eliminações concluídas com `requestId`, UUID interno do titular, versão
  da rotina e data. Ele existe para impedir ressurreição após restore e não deve conter e-mail,
  nome ou conteúdo.

## 7. Inventário de dados e retenção

### 7.1 Artefatos obrigatórios

Criar:

- `docs/privacy/data-inventory.md`;
- `docs/privacy/retention-policy.md`;
- `docs/privacy/data-subject-rights.md`;
- `docs/privacy/processors.md`;
- `docs/privacy/export-schema.md`;
- `docs/runbooks/data-subject-request.md`;
- `docs/runbooks/account-erasure.md`.

O inventário precisa ser validado contra entities, migrations, storage, configuração, logs,
métricas, backups e provedores. Uma revisão apenas das tabelas não é suficiente.

### 7.2 Colunas mínimas do inventário

| Dimensão | Exemplo de conteúdo esperado |
| --- | --- |
| dado | campo ou conjunto claramente delimitado |
| titular | candidato, contratante, usuário interno ou terceiro citado |
| origem | cadastro, próprio titular, outro usuário, sistema ou fornecedor |
| finalidade | finalidade específica, não “melhorar o serviço” genericamente |
| base legal | decisão aprovada, com responsável |
| obrigatoriedade | necessário, opcional ou derivado |
| visibilidade | titular, contratante autorizado, equipe, admin, público |
| sistemas | tabela, storage, log, backup e fornecedor |
| compartilhamento | destinatário, finalidade e região |
| gatilho | criação, encerramento, revogação ou solicitação |
| retenção | prazo ou evento de término aprovado |
| destino | excluir, anonimizar, agregar ou preservar por exceção |
| evidência | teste, query, lifecycle ou relatório do job |
| owner | responsável por revisar e executar |

### 7.3 Conjuntos que não podem faltar

| Conjunto | Pontos a decidir |
| --- | --- |
| `users` | e-mail, nome, senha derivada, estado, último login e tombstone |
| tokens de autenticação | hashes, IPs, expiração, revogação e limpeza |
| `term_acceptances` | versão, data, IP e user-agent; necessidade e prazo de contexto |
| perfil de candidato | texto livre, preferências, experiências, formação e links |
| perfil de contratante | responsável, contatos e distinção entre dado pessoal e empresarial |
| `profile_assets` | avatar, logo, currículo, nomes originais e objetos em storage |
| vagas | autoria, texto potencialmente pessoal, moderação e candidaturas dependentes |
| candidaturas | mensagem, estado, histórico e dados de terceiros acessíveis ao contratante |
| snapshots | PDF completo, nome original, processo associado e retenção já iniciada na etapa 3 |
| denúncias | denunciante, titular, descrição potencialmente sensível e evidência de moderação |
| decisões | ator, motivo, vínculo com denúncia, vaga ou usuário |
| auditoria | IDs pseudônimos, IP, user-agent, contexto e necessidade de investigação |
| rate limit | hashes de chaves e expiração |
| outbox | destinatário, template, payload cifrado e erros |
| idempotência | hash da chave, ator, recurso e expiração |
| exportações | pacote completo, storage, downloads e lifecycle |
| pedidos do titular | protocolo, estados, razões e evidência de conclusão |
| logs e métricas | campos, labels, sampling, acesso e retenção |
| backups | conteúdo, região, criptografia, cópias, expiração e restaurações |

Para cada campo JSON ou texto livre, o inventário deve considerar que o usuário pode inserir dados
pessoais ou sensíveis não previstos. Não basta classificar apenas pelo nome da coluna.

## 8. Contratos dos direitos do titular

### 8.1 Área de conta

Criar uma rota Web autenticada, sugerida como `/app/conta/privacidade`, com:

- resumo dos dados e finalidades;
- link para corrigir os campos editáveis;
- pedido e estado de exportação;
- lista de consentimentos realmente opcionais;
- pedido e cancelamento de exclusão;
- protocolo, prazos e canal assistido;
- mensagens específicas para solicitação recebida, identidade pendente, processamento, bloqueio
  jurídico, falha recuperável e conclusão.

A interface não deve afirmar que a exclusão é instantânea nem esconder a diferença entre exclusão,
anonimização e retenção obrigatória.

### 8.2 Reautenticação

Exportação completa, alteração de e-mail e exclusão exigem:

1. sessão ativa;
2. CSRF e origem válidos;
3. prova suficiente de vínculo com a conta;
4. senha atual validada novamente no fluxo self-service;
5. rate limit por usuário e finalidade;
6. evento de auditoria sem copiar senha ou e-mail.

Na primeira implementação, a senha pode ser enviada no corpo da própria ação crítica e consumida
somente para Argon2. Ela não deve ser persistida, ecoada ou registrada. Antes de suportar login
federado ou passkeys, extrair uma abstração de prova de presença recente em vez de espalhar a
verificação pelos controllers. E-mail verificado pode reforçar a prova, mas não pode ser o único
caminho: uma conta ainda pendente de verificação também precisa conseguir exercer direitos pelo
fluxo autenticado ou assistido.

### 8.3 Endpoints propostos

| Endpoint | Regra principal |
| --- | --- |
| `GET /privacy/summary` | contrato mínimo de finalidades, consentimentos e pedidos ativos |
| `POST /privacy/exports` | reautentica, cria pedido idempotente e agenda geração |
| `GET /privacy/exports/:id` | somente titular; retorna estado e expiração |
| `POST /privacy/exports/:id/download` | prova de posse, download privado e auditado |
| `PATCH /users/me` | corrige nome de conta por allowlist |
| `POST /auth/email-change` | cria troca pendente sem substituir o e-mail atual |
| `POST /auth/email-change/confirm` | confirma token de uso único, revoga sessões e conclui troca |
| `GET /privacy/consents` | lista catálogo vigente e manifestação do titular |
| `PUT /privacy/consents/:purpose` | registra consentimento opcional específico |
| `DELETE /privacy/consents/:purpose` | revoga e agenda os efeitos definidos no catálogo |
| `POST /privacy/account-deletion` | reautentica, cria protocolo e inicia período de segurança |
| `GET /privacy/account-deletion` | retorna estado limitado do pedido do próprio titular |
| `POST /privacy/account-deletion/cancel` | reautentica e cancela antes do ponto irreversível |

Pedidos de representante legal, conta sem acesso ou contestação de recusa entram pelo canal
assistido. Endpoints administrativos não devem permitir que suporte faça download indiscriminado da
exportação; o acesso excepcional precisa de papel, justificativa, auditoria e entrega segura ao
titular.

## 9. Exportação segura

### 9.1 Conteúdo

O pacote deve possuir `manifest.json` com:

- versão do schema e data de geração;
- identidade do controlador e canal de contato;
- categorias, origem, finalidade, critérios e retenção aprovados;
- entidades públicas e privadas com as quais houve compartilhamento, quando aplicável;
- arquivos JSON separados por domínio;
- hashes e descrição dos arquivos binários incluídos.

Pode incluir dados da própria conta, aceites, perfil, arquivos próprios, vagas criadas, candidaturas
do candidato, denúncias criadas pelo titular e histórico que diga respeito a ele, conforme D-06.

Deve excluir ou redigir:

- `passwordHash`, hashes e valores de tokens, segredo CSRF e chave de idempotência;
- credenciais, configurações e detalhes internos de segurança;
- IP e user-agent sem decisão explícita de inclusão;
- identidade e conteúdo pessoal de outros candidatos acessíveis a um contratante;
- identidade de denunciantes, motivos internos e investigação que pertençam a terceiros;
- auditoria administrativa que apenas mencione o titular, mas exponha outro ator sem necessidade;
- chaves internas de storage e URLs permanentes.

O exportador deve trabalhar por allowlist e schema versionado. Cada módulo devolve um DTO de
exportação próprio, e testes negativos falham quando um campo proibido aparece.

### 9.2 Geração e download

1. criar o pedido e responder `202` com protocolo;
2. worker reservar o pedido com `FOR UPDATE SKIP LOCKED`;
3. buscar cada domínio em transação de leitura consistente ou registrar o instante de corte;
4. validar todos os fragmentos com schemas compartilhados;
5. montar pacote, calcular hash e gravar em storage privado;
6. persistir o artefato e enfileirar notificação na mesma transação de conclusão;
7. permitir download autenticado, com `Cache-Control: no-store`, `nosniff` e nome neutro;
8. registrar download sem conteúdo;
9. eliminar o artefato no vencimento e medir itens atrasados;
10. manter apenas protocolo, resultado e hash pelo prazo aprovado.

O pacote nunca deve ser anexado ao e-mail. A notificação leva o usuário de volta à área autenticada.

## 10. Correção e consentimento

### 10.1 Correção

Mapear cada dado para uma das respostas:

- autocorreção imediata pela interface;
- correção com verificação, como troca de e-mail;
- correção assistida, quando exigir análise;
- registro imutável que recebe adendo em vez de edição;
- recusa fundamentada por obrigação ou integridade de evidência.

Troca de e-mail deve:

- manter o e-mail atual até confirmar o novo;
- impedir enumeração na resposta pública;
- armazenar apenas hash do token;
- enviar notificação ao endereço antigo e verificação ao novo por outbox;
- bloquear concorrência e invalidar pedido anterior;
- incrementar `authVersion` e revogar refresh tokens na conclusão;
- registrar antes/depois sem gravar os endereços na auditoria.

Relatos, decisões e históricos não devem ser sobrescritos para simular correção. Quando uma
informação imutável precisar de contestação, criar adendo rastreável e aplicar a política aprovada.

### 10.2 Consentimento

Só criar um toggle quando existirem:

- finalidade opcional específica;
- texto e versão;
- efeito real de aceitar e de recusar;
- rotina real de revogação;
- prova de que a funcionalidade principal não é indevidamente condicionada;
- retenção do histórico da manifestação.

Revogação deve ser gratuita, tão acessível quanto o aceite e produzir outbox/job idempotente para
interromper o tratamento e eliminar ou isolar os dados abrangidos. Tratamentos realizados por outra
base legal não devem ser interrompidos sob o rótulo incorreto de consentimento.

## 11. Exclusão e anonimização

### 11.1 Máquina de estados

```text
pedido + reautenticação
  -> scheduled
    -> cancelado pelo titular antes do ponto irreversível
    -> processing
      -> completed
      -> partially_completed com retenção justificada
      -> failed_retryable
```

No agendamento:

- gerar protocolo e `scheduledFor` conforme D-05;
- incrementar `authVersion` e revogar todos os refresh tokens;
- aplicar o estado de conta aprovado para o período de segurança;
- definir o que acontece com perfil público, vagas abertas, candidaturas e denúncias;
- enfileirar confirmação;
- impedir dois pedidos ativos.

O login de uma conta em exclusão, se permitido, deve levar apenas à tela de status/cancelamento. Os
guards precisam recusar todos os demais recursos no backend. Cancelar não deve republicar
silenciosamente conteúdo que tenha sido fechado ou moderado.

### 11.2 Plano por domínio

O executor deve obter um plano antes de alterar dados. Cada item recebe uma ação
`delete`, `anonymize`, `retain`, `manual_review` ou `not_found`, acompanhada por regra versionada.

| Domínio | Tratamento técnico a implementar após aprovação |
| --- | --- |
| sessão | revogar tokens, invalidar access por `authVersion` e eliminar tokens transitórios |
| usuário | substituir e-mail/nome por valores irreversíveis, inutilizar credencial e manter tombstone mínimo |
| aceites | preservar ou eliminar conforme obrigação; expirar IP/user-agent separadamente |
| candidato | remover campos e arquivos pessoais; tratar dependência de candidaturas |
| contratante | separar dados da pessoa responsável de dados não pessoais da organização |
| assets | excluir objetos e metadados; retry idempotente quando o objeto já não existir |
| vagas | fechar exposição e anonimizar autoria/conteúdo pessoal conforme política |
| candidaturas | remover mensagem e identificadores desnecessários; respeitar processo e obrigação aprovados |
| snapshots | excluir PDF quando não houver retenção válida; nunca manter só porque o storage é difícil |
| denúncias | preservar evidência necessária pelo prazo aprovado, restringir e anonimizar identidade possível |
| decisões | manter integridade de estado sem manter nome/e-mail do ator |
| auditoria | apontar para tombstone, reduzir IP/user-agent por job e preservar contexto mínimo |
| outbox/exportação | cancelar mensagens e apagar artefatos; preservar apenas resultado mínimo |
| logs/backup | expirar pela política e aplicar replay de tombstone em restauração |

### 11.3 Saga idempotente

Banco e storage não compartilham uma transação. A exclusão deve ser uma saga persistida:

1. lock do pedido e da conta;
2. preflight de retenções e pendências;
3. criação dos passos versionados;
4. remoção ou isolamento de objetos de storage;
5. anonimização transacional das tabelas liberadas;
6. gravação do ledger de eliminação;
7. criação da notificação final cifrada antes de perder o contato;
8. conclusão e limpeza do payload transitório;
9. retry somente dos passos incompletos.

Se o storage falhar, o pedido fica indisponível ao usuário e `failed_retryable`; o banco não deve
marcar conclusão falsa. `NotFound` no storage conta como sucesso idempotente. Um pedido repetido após
conclusão retorna o mesmo protocolo e não recria dados ou mensagens.

### 11.4 Backups e ressurreição

Backups imutáveis não devem ser editados. A política deve:

- limitar e cumprir a retenção das cópias;
- restringir seu uso a recuperação;
- manter ledger ou journal de eliminações posterior ao ponto restaurado;
- após qualquer restore, impedir abertura ao tráfego;
- reaplicar migrations, tombstones, revogações e eliminações posteriores;
- validar por query e somente então liberar o ambiente;
- destruir o ambiente de ensaio conforme runbook.

Restaurar backup para “desfazer” uma exclusão concluída é proibido.

## 12. Cadastro atômico e outbox

### 12.1 Fronteira transacional

Argon2, geração de valores aleatórios e montagem de DTO podem ocorrer antes da transação. Dentro de
uma única transação PostgreSQL:

1. inserir o usuário;
2. inserir os três aceites com o mesmo `EntityManager`;
3. persistir hash do token de verificação;
4. persistir hash do refresh token e família da sessão;
5. inserir evento de auditoria;
6. inserir mensagem cifrada na outbox;
7. confirmar tudo ou reverter tudo.

Assinar o access token e definir cookies acontece somente após commit. O provedor de e-mail nunca é
chamado dentro da transação.

`UsersService.createPublicUser`, `TermsService.acceptAll`, criação de tokens e auditoria devem
aceitar `EntityManager` ou ser movidos para um orquestrador transacional. Não usar `Promise.all`
com repositórios globais dentro da transação.

### 12.2 Dispatcher

O worker deve:

- reservar lotes com lease e `FOR UPDATE SKIP LOCKED`;
- enviar fora da transação curta de reserva;
- usar a chave da outbox como idempotency key do provedor, quando suportada;
- considerar sucesso duplicado como sucesso;
- aplicar backoff exponencial limitado com jitter;
- classificar erro permanente e transitório;
- mover para `dead` após o teto e alertar;
- permitir replay administrativo por ID sem editar payload;
- medir atraso do item mais antigo, tentativas, sucesso, erro e fila morta;
- nunca registrar destinatário, corpo ou URL com token.

Verificação inicial, reenvio, reset, troca de e-mail, exportação pronta, exclusão agendada e exclusão
concluída devem usar a mesma infraestrutura. Cada template tem versão e chave de deduplicação.

### 12.3 Recuperação

- commit com provedor indisponível: usuário e outbox existem; worker repete;
- rollback antes do commit: e-mail não existe e uma nova tentativa pode usar o mesmo endereço;
- resposta HTTP perdida após commit: login e reenvio oferecem caminho sem criar segunda conta;
- crash depois do envio e antes de marcar `sent`: deduplicação do provedor evita mensagem duplicada;
- fila morta: alerta e runbook permitem replay depois de corrigir a causa;
- token expirado na fila: gerar novo token por um comando de domínio, não prolongar o antigo
  silenciosamente.

## 13. Idempotência e transições de estado

### 13.1 Contrato HTTP

O Web deve gerar uma chave aleatória por intenção do usuário e enviá-la em `Idempotency-Key` para:

- `POST /jobs`;
- `POST /applications`;
- futuras mutações explicitamente classificadas.

Regras:

- retry da mesma intenção reutiliza a chave;
- uma nova ação usa outra chave;
- mesma chave e mesmo fingerprint devolvem o recurso original;
- mesma chave com corpo diferente retorna `409` e código estável;
- execução ainda ativa retorna estado estável, sem iniciar outra;
- chave inválida ou ausente é rejeitada quando a fase de compatibilidade terminar;
- respostas de replay informam `Idempotency-Replayed: true`;
- login, refresh e reset não fazem replay de credenciais ou tokens por essa tabela.

### 13.2 Algoritmo

1. normalizar ator, método, rota e corpo validado;
2. calcular fingerprint SHA-256;
3. inserir/reservar registro com constraint única;
4. quando houver conflito, lock e comparar fingerprint;
5. executar domínio;
6. gravar recurso/status na mesma transação da criação;
7. responder;
8. limpar registros expirados por job.

Para candidatura, o destino do snapshot deve derivar do ID da candidatura ou do registro de
idempotência. Um crash depois de copiar o arquivo não pode produzir dois snapshots. Compensação e
reconciliação removem órfãos, mas não são a garantia primária.

### 13.3 Histórico

Toda transição relevante deve registrar:

- agregado e versão resultante;
- estado anterior e novo;
- ator humano ou `system`;
- motivo controlado e, quando necessário, justificativa validada;
- `requestId`, idempotency record e data;
- efeito correlato, como fechamento, revogação ou notificação.

Dois atores concorrentes não podem concluir a mesma versão. Usar lock pessimista onde já existe ou
update condicional por `state_version`; não confiar apenas no último `save`.

## 14. Operação segura

### 14.1 PostgreSQL e endpoints remotos

Adicionar configuração tipada:

- modo TLS do banco;
- CA confiável obtida do cofre ou arquivo montado;
- `rejectUnauthorized: true` em conexão remota;
- recusa de produção quando TLS verificável estiver ausente, salvo exceção privada aprovada;
- HTTPS obrigatório para gateway de e-mail, storage e telemetria remotos;
- timeouts explícitos.

`getTypeOrmOptions` e o data source de migration devem produzir a mesma política SSL. Um teste de
configuração precisa impedir que a aplicação rode segura e a CLI de migration rode insegura.

No Compose:

```yaml
ports:
  - '127.0.0.1:5432:5432'
```

Aplicar a mesma regra ao PostgreSQL de teste. O Compose continua somente local, com credenciais
fictícias.

### 14.2 Backup e restore

Escolher um mecanismo que ofereça:

- backup automático criptografado;
- retenção e região aprovadas;
- credencial separada e acesso mínimo;
- point-in-time recovery quando necessário ao RPO;
- imutabilidade ou proteção contra deleção maliciosa;
- monitoramento de último backup válido;
- exportação de evidência sem expor dados.

O ensaio de restore deve:

1. registrar backup, horário e commit/migrations compatíveis;
2. criar ambiente isolado sem saída de e-mail e sem tráfego público;
3. restaurar com credenciais temporárias;
4. aplicar migrations necessárias;
5. reaplicar ledger de exclusões posterior ao backup;
6. verificar contagens, constraints, hashes amostrais e fluxos sintéticos;
7. medir RPO e RTO reais;
8. registrar resultado, falhas e ações;
9. destruir dados e credenciais temporários.

Não usar dados restaurados para desenvolvimento ou teste comum.

### 14.3 Migrations

Cada mudança incompatível usa:

1. expansão de schema compatível;
2. deploy que escreve no formato novo e ainda lê o antigo quando necessário;
3. backfill observável, em lotes e retomável;
4. verificação de completude;
5. troca de leitura;
6. janela de estabilização;
7. contração em entrega posterior, com backup e aprovação.

Migration de exclusão não deve executar varredura destrutiva sem dry-run, contagem, lote e regra
versionada.

## 15. Logs, métricas e alertas

### 15.1 Logs estruturados

Padronizar JSON com:

- timestamp UTC;
- nível;
- serviço, ambiente, versão e commit;
- `requestId`;
- rota normalizada, método, status, duração e resultado;
- tipo de job, tentativa e código de erro;
- IDs internos somente quando indispensáveis e aprovados.

Gerar `requestId` no primeiro proxy confiável ou na API, validar formato recebido e devolvê-lo em
`X-Request-ID`. Propagar para outbox e jobs sem transformá-lo em label de métrica.

Redigir sempre:

- `Authorization`, `Cookie`, `Set-Cookie` e `X-CSRF-Token`;
- senha e confirmação;
- access, refresh, verificação, reset e reautenticação;
- e-mail, telefone, nome e endereço;
- bio, mensagem de candidatura, descrição de denúncia e currículo;
- corpo de exportação e payload cifrado da outbox;
- query strings de links com token.

Preferir logger estruturado integrado ao Nest e configurar redaction na origem. Um teste captura a
saída e busca valores-canário proibidos.

### 15.2 Métricas

| Métrica | Dimensões permitidas |
| --- | --- |
| requisições e latência | rota template, método e classe de status |
| autenticação | operação e resultado controlado |
| refresh reuse | resultado, sem sessão ou usuário |
| rate limit | nome da política |
| outbox | tipo de mensagem, estado e código de erro controlado |
| exportação | estado, versão de schema e duração |
| exclusão | estado e passo controlado |
| pedidos do titular | tipo e estado; nunca protocolo |
| storage/scan | operação, driver e resultado |
| retenção | tipo de job e resultado |
| banco | pool, erro, tempo e lock |
| backup | idade do último sucesso e resultado do último restore |

E-mail, IP, user ID, target ID, `requestId`, chave de storage e protocolo são labels proibidos. A
cardinalidade deve ser testada.

### 15.3 Alertas

Criar alertas acionáveis para:

- fila morta ou idade excessiva da outbox;
- pedido do titular aproximando-se ou ultrapassando o prazo;
- exportação ou exclusão presa;
- artefato vencido ainda disponível;
- falha de revogação de sessão;
- `5xx`, latência e indisponibilidade acima da linha de base;
- aumento anormal de `401`, `403`, `429` e refresh reuse;
- falha ou atraso de e-mail, storage, scan e retenção;
- backup ausente ou falho;
- restore periódico vencido;
- migration incompatível ou worker sem progresso;
- incidente ou vazamento em triagem sem owner.

Metas numéricas de disponibilidade e latência são definidas depois de staging gerar uma linha de
base. Prazos legais e operacionais aprovados não dependem dessa linha de base.

## 16. Runbooks

Criar ou ampliar:

| Runbook | Conteúdo mínimo |
| --- | --- |
| pedido do titular | identidade, protocolo, classificação, prazo, execução, revisão e evidência |
| exclusão | preflight, dry-run, passos, retry, retenção, conclusão e restore |
| outbox/e-mail | fila, erro, replay, deduplicação, token expirado e fila morta |
| backup/restore | RPO/RTO, isolamento, comandos do provedor, validação e destruição |
| incidente | detecção, contenção, preservação, risco, comunicação, lições e registro |
| vazamento | categorias afetadas, titulares, avaliação de dano, owner e modelos aprovados |
| credencial comprometida | rotação, revogação, impacto, evidência e validação |
| indisponibilidade | banco, e-mail, storage, ClamAV, Web e API |
| migration | expandir, backfill, verificar, contrair e retornar artefato |
| observabilidade | dashboards, alertas, escalonamento, silenciamento e teste |

O runbook de incidente deve refletir a regulamentação vigente na data da ativação. A orientação
oficial consultada em 2026-07-26 informa comunicação à ANPD e aos titulares em três dias úteis
quando houver risco ou dano relevante e registro do incidente pelo período regulamentar. Esses
valores devem ser verificados novamente antes da publicação.

## 17. Pacotes de trabalho

### Pacote 4.0 — governança e inventário

Entregas:

- concluir D-01 a D-12;
- criar inventário, matriz de retenção, registro de fornecedores e schemas de exportação;
- mapear FKs e objetos de storage por usuário;
- classificar texto livre, terceiros, dados sensíveis e dados empresariais;
- definir protocolo e canal assistido;
- produzir exemplos aprovados de exportação e anonimização.

Critério de saída:

- nenhuma célula crítica está sem owner;
- prazo desconhecido está marcado como pendente e bloqueia o código destrutivo;
- jurídico, produto, segurança e operação aprovaram seus campos;
- diff entre entities/migrations e inventário não possui conjunto sem classificação.

### Pacote 4.1 — correlação e observabilidade básica

Entregas:

- logger JSON, `requestId`, redaction e métricas HTTP;
- métricas de workers já existentes;
- adapter de métricas e endpoint interno protegido;
- dashboards iniciais sem metas arbitrárias;
- testes de canário de segredo e cardinalidade.

Critério de saída:

- uma requisição pode ser seguida da API até audit/outbox;
- nenhum canário pessoal aparece em log ou métrica;
- rota pública não expõe métricas;
- falha de exportação/outbox futura já possui padrão observável.

### Pacote 4.2 — cadastro atômico e outbox

Entregas:

- migrations da outbox;
- payload cifrado e gestão de chave;
- dispatcher com lock, lease, retry, deduplicação e fila morta;
- transação única de cadastro;
- migração de verificação, reset e reenvio para outbox;
- comando seguro de replay;
- métricas, alertas e runbook.

Critério de saída:

- falha em qualquer insert reverte usuário, aceites, tokens, auditoria e mensagem;
- indisponibilidade do provedor não reverte cadastro;
- consumidor concorrente envia uma vez ou obtém deduplicação equivalente;
- token, destinatário e conteúdo não aparecem em log;
- item morto gera alerta e pode ser reprocessado.

### Pacote 4.3 — idempotência e histórico

Entregas:

- tabela e decorator/serviço de idempotência;
- contrato compartilhado e suporte no Web;
- criação de vaga e candidatura protegidas;
- snapshot determinístico e reconciliação de órfãos;
- versões e históricos de estado;
- job de limpeza.

Critério de saída:

- 20 requisições concorrentes com a mesma chave criam um recurso;
- mesma chave com outro corpo recebe `409`;
- timeout depois do commit pode repetir e receber o recurso original;
- duas decisões sobre a mesma versão não são aceitas;
- limpeza não remove uma execução ativa.

### Pacote 4.4 — pedidos e exportação

Entregas:

- tabelas, estados e eventos dos pedidos;
- contributors por domínio;
- pacote versionado, storage privado e lifecycle;
- interface de pedido, acompanhamento e download;
- notificação via outbox;
- canal assistido e runbook.

Critério de saída:

- candidato e contratante recebem somente seus próprios dados;
- acesso como outro usuário retorna resposta não enumerável;
- exportação não contém segredo, hash de token, currículo alheio ou investigação de terceiro;
- artefato vencido não baixa e é removido;
- pedido, geração, download e expiração são auditáveis.

### Pacote 4.5 — correção e consentimentos

Entregas:

- matriz de correção;
- atualização de dados da conta;
- troca de e-mail em duas fases;
- catálogo e ledger de consentimentos opcionais aprovados;
- efeitos idempotentes de revogação;
- interface e contratos.

Critério de saída:

- novo e-mail não substitui o atual antes da confirmação;
- troca revoga sessões e notifica os dois lados conforme política;
- aceite obrigatório não aparece como consentimento revogável;
- revogação interrompe o tratamento opcional e produz evidência;
- correção imutável usa adendo em vez de sobrescrita.

### Pacote 4.6 — exclusão e anonimização

Entregas:

- estado da conta e máquina do pedido;
- reautenticação, período de segurança e cancelamento;
- planner por domínio;
- saga idempotente e ledger;
- jobs de IP/user-agent e demais retenções aprovadas;
- integração com backup/restore;
- interface, notificações e runbook.

Critério de saída:

- sessões deixam de funcionar imediatamente após o gatilho aprovado;
- cancelamento funciona somente antes do ponto irreversível;
- storage indisponível não gera conclusão falsa;
- retry não duplica nem corrompe histórico;
- cada dado retido possui código e regra aprovados;
- busca por e-mail, nome e objetos eliminados não encontra o titular;
- restore de backup anterior reaplica o ledger antes da liberação.

### Pacote 4.7 — TLS, backup e restauração

Entregas:

- SSL verificado na API e CLI;
- HTTPS validado para dependências;
- bind local do Compose;
- backup automático, criptografado e monitorado;
- ensaio de restore isolado;
- medição de RPO/RTO;
- runbooks de indisponibilidade, credencial e migration.

Critério de saída:

- produção recusa conexão remota insegura;
- banco local não escuta em todas as interfaces;
- último backup e restore são visíveis;
- restauração atende ao objetivo aprovado ou gera ação corretiva com owner;
- o ambiente restaurado é destruído e a evidência não contém dados.

### Pacote 4.8 — incidentes e gate final

Entregas:

- dashboards e alertas completos;
- tabletop de incidente e vazamento;
- simulação de fila morta, storage indisponível e banco restaurado;
- revisão de acesso aos provedores;
- atualização de checklist, arquitetura e segurança;
- relatório final de execução.

Critério de saída:

- on-call identifica owner, impacto e ação sem consultar conhecimento informal;
- alerta contém contexto técnico suficiente e nenhum dado pessoal;
- simulações possuem horário, decisão, evidência e follow-up;
- todos os critérios transversais e gates para beta estão comprovados.

## 18. Dependências e sequência

```text
4.0 decisões/inventário
  ├─> 4.2 outbox/cadastro ─> 4.3 idempotência
  ├─> 4.4 exportação ──────> 4.5 correção/consentimento
  └─> 4.6 exclusão ────────> 4.7 restore

4.1 observabilidade alimenta 4.2 a 4.8
4.2 outbox alimenta notificações de 4.4 a 4.6
4.8 fecha todos os pacotes
```

Sequência recomendada de pull requests:

| PR | Conteúdo | Dependência | Tamanho |
| --- | --- | --- | --- |
| 1 | documentos de governança, inventário e decisões | etapas 0–3 | M |
| 2 | logger, `requestId`, redaction e métricas base | PR 1 | M |
| 3 | schema e worker de outbox | PR 2 | L |
| 4 | cadastro, verificação e reset transacionais | PR 3 | L |
| 5 | idempotência e históricos | PR 2 | L |
| 6 | pedidos e exportação | PRs 1–3 | L |
| 7 | correção e consentimentos aprovados | PRs 1 e 6 | M/L |
| 8 | exclusão, anonimização e ledger | PRs 1–3 e 6 | XL |
| 9 | TLS, backup e restore | PRs 1, 2 e 8 | L |
| 10 | runbooks, simulações e evidência final | todos | M |

Referência inicial para uma pessoa:

| Pacote | Esforço de engenharia |
| --- | --- |
| 4.0 | 3–5 dias, sem contar espera por decisões |
| 4.1 | 4–6 dias |
| 4.2 | 7–10 dias |
| 4.3 | 6–9 dias |
| 4.4 | 8–12 dias |
| 4.5 | 5–8 dias |
| 4.6 | 12–18 dias |
| 4.7 | 6–10 dias, dependente do provedor |
| 4.8 | 4–7 dias |

Estimativa total inicial: 55–85 dias úteis de engenharia para uma pessoa, além do tempo de decisão,
contratação, homologação jurídica e observação de staging. Reestimar depois dos pacotes 4.0 e 4.2.
Exclusão/anonimização não deve ser comprimida para cumprir uma data de beta.

## 19. Estratégia de testes

### 19.1 Unitários

- normalização e allowlist do inventário/exportação;
- máquina de estados de pedidos;
- plano de anonimização por domínio;
- fingerprint e conflito de idempotência;
- backoff, lease e classificação de erro da outbox;
- redaction de logs;
- labels permitidas de métricas;
- cálculo de prazo e expiração com relógio injetável;
- validação SSL/HTTPS por ambiente.

### 19.2 Integração PostgreSQL

- rollback do cadastro em cada fronteira;
- commit com outbox e sem chamada ao provedor;
- dois dispatchers disputando o mesmo lote;
- crash/lease expirado e retomada;
- mesma idempotency key em concorrência;
- state version concorrente;
- exportação de cada papel e testes negativos de terceiros;
- criação, cancelamento e execução da exclusão;
- FK `RESTRICT`, tombstone, retenção parcial e job de limpeza;
- migration forward/revert onde revert for seguro;
- restore lógico de fixture seguido por replay do ledger.

### 19.3 Falha injetada

| Fronteira | Cenário esperado |
| --- | --- |
| banco antes do commit | nenhum efeito visível ou mensagem |
| resposta HTTP após commit | retry retorna resultado idempotente |
| e-mail `429`/`5xx`/timeout | retry com backoff, sem rollback de domínio |
| e-mail `4xx` permanente | fila morta e alerta |
| storage no upload da exportação | pedido retomável, sem artefato pronto falso |
| storage na exclusão | passo pendente; banco não conclui |
| processo cai após enviar e-mail | deduplicação impede efeito duplicado |
| processo cai após apagar objeto | retry recebe `NotFound` como sucesso |
| lock concorrente | somente um worker executa o pedido |
| backup anterior à exclusão | replay elimina novamente antes de liberar |

### 19.4 Segurança e privacidade

- IDOR em protocolo, exportação, download e cancelamento;
- CSRF, origem inválida e sessão expirada;
- reautenticação ausente, senha errada e rate limit;
- zip slip, nome malicioso e pacote excessivo;
- cache e headers do download;
- tokens, e-mails e conteúdo-canário ausentes em logs, métricas, audit e outbox aberta;
- exportação do empregador sem dados dos candidatos;
- exportação do candidato sem notas internas do empregador/moderação;
- consentimento opcional sem dark pattern e com navegação por teclado;
- conta `deletion_pending` bloqueada em todas as rotas não permitidas.

### 19.5 Operacionais

- produção falha ao iniciar com banco remoto sem validação de certificado;
- CLI de migration usa a mesma política;
- Compose escuta somente em loopback;
- alerta sintético de outbox, pedido vencendo e backup atrasado;
- restore cronometrado e validado;
- tabletop de incidente com registro de decisões;
- verificação de acesso mínimo a banco, storage, backup e telemetria.

## 20. Rollout

1. aprovar inventário e decisões;
2. adicionar schemas de forma compatível, sem habilitar endpoints;
3. publicar observabilidade e obter linha de base;
4. habilitar outbox em staging com provider sandbox;
5. migrar um tipo de e-mail por vez e observar deduplicação/atraso;
6. ativar idempotência opcional, atualizar Web e depois exigir header;
7. gerar exportações somente para contas sintéticas e comparar com queries do inventário;
8. habilitar exportação para grupo interno autorizado;
9. executar exclusão em `dry-run`, sem mutação, e revisar o plano;
10. executar exclusão real somente em contas sintéticas;
11. restaurar backup anterior e reaplicar ledger;
12. ativar direitos do titular por feature flag;
13. observar SLAs, fila, storage, logs e alertas;
14. remover flags temporárias somente após estabilização;
15. registrar data, commit, migrations, configuração, evidência e aprovadores.

Flags temporárias sugeridas:

- `OUTBOX_DISPATCH_ENABLED`;
- `PRIVACY_EXPORT_ENABLED`;
- `ACCOUNT_DELETION_ENABLED`;
- `IDEMPOTENCY_REQUIRED`;
- `ERASURE_DRY_RUN`.

O schema e os workers devem se comportar com segurança quando uma flag está desligada. Produção não
deve oferecer endpoint que aceite o pedido se não houver executor e owner operacional.

## 21. Rollback

- migrations aditivas permanecem; reverter artefato não remove tabelas ou histórico;
- desligar dispatcher interrompe envio, mas preserva a fila;
- voltar temporariamente ao envio direto exige bloquear o dispatcher e reconciliar pendentes para
  não duplicar mensagens;
- idempotency records permanecem válidos durante rollback;
- exportação pode ser desabilitada preservando pedidos e eliminando artefatos vencidos;
- exclusão pode ser pausada antes do passo irreversível, nunca revertida por restauração;
- conta já anonimizada não recupera identidade;
- falha de TLS só admite rollback por artefato anterior sob exceção aprovada, não por
  `rejectUnauthorized: false` escondido;
- falha de backup impede promoção, mas não autoriza apagar a última cópia válida;
- toda decisão de rollback registra owner, período, risco e condição de saída.

## 22. Arquivos previstos

Novos ou equivalentes:

```text
apps/api/src/privacy/
  privacy.module.ts
  privacy.controller.ts
  privacy.service.ts
  data-subject-request.entity.ts
  data-subject-request-event.entity.ts
  data-export-artifact.entity.ts
  user-consent.entity.ts
  export/
  erasure/

apps/api/src/outbox/
  outbox.module.ts
  outbox-message.entity.ts
  outbox.service.ts
  outbox-dispatcher.service.ts

apps/api/src/common/idempotency/
  idempotency.module.ts
  idempotency-record.entity.ts
  idempotency.service.ts
  idempotency.decorator.ts

apps/api/src/common/observability/
  observability.module.ts
  request-context.middleware.ts
  metrics.service.ts

apps/web/app/app/conta/privacidade/page.tsx
apps/web/components/privacy-center.tsx
docs/privacy/*
docs/runbooks/data-subject-request.md
docs/runbooks/account-erasure.md
docs/runbooks/outbox-email.md
docs/runbooks/backup-restore.md
docs/runbooks/incident-response.md
```

Arquivos existentes com alteração provável:

- `apps/api/src/app.module.ts`;
- `apps/api/src/auth/auth.service.ts` e testes;
- `apps/api/src/terms/terms.service.ts`;
- `apps/api/src/email/*`;
- `apps/api/src/users/user.entity.ts`, controller e service;
- `apps/api/src/jobs/*`;
- `apps/api/src/profiles/*`;
- `apps/api/src/reports/*`;
- `apps/api/src/audit/*`;
- `apps/api/src/common/config/env.validation.ts`;
- `apps/api/src/database/typeorm.config.ts` e `data-source.ts`;
- `packages/shared/src/schemas.ts` e `platform.ts`;
- `apps/web/lib/api.ts`;
- `.env.example`, `docker-compose.yml` e runbooks;
- migrations novas, sempre forward-first.

## 23. Definição de pronto

A etapa 4 só está concluída quando:

- D-01 a D-12 possuem decisão e responsável;
- inventário e matriz de retenção correspondem ao schema e aos provedores reais;
- confirmação/acesso, correção, exportação, consentimento e exclusão têm caminho utilizável;
- exportações foram revisadas por papel e não contêm dados de terceiros ou segredos;
- exclusão é idempotente entre banco, storage, logs transitórios e restore;
- cadastro não deixa conta parcial e e-mail indisponível não perde notificação;
- vaga e candidatura resistem a retry e concorrência;
- transições registram ator, versão e motivo;
- banco remoto valida certificado e endpoints remotos usam HTTPS;
- backup automático e restore isolado possuem evidência recente;
- logs, métricas e alertas detectam falha sem copiar dados pessoais;
- runbooks foram exercitados, não apenas escritos;
- contratos compartilhados e Swagger foram atualizados;
- migrations foram testadas em banco vazio e sobre o estado anterior;
- `pnpm validate`, `pnpm audit:prod` e `git diff --check` passam;
- testes de falha, concorrência, segurança e restore passam;
- o relatório de execução registra commit, ambiente, resultados, limitações e pendências.

## 24. Marco final

O marco não é “há uma tela de excluir conta”. A etapa termina quando uma conta sintética pode:

1. cadastrar-se durante indisponibilidade do e-mail sem ficar parcial;
2. receber depois a notificação uma única vez;
3. repetir criação de vaga ou candidatura sem duplicação;
4. pedir e baixar uma exportação que contenha somente seus dados;
5. corrigir dados e revogar um consentimento opcional real;
6. solicitar e cancelar exclusão durante o período aprovado;
7. concluir exclusão/anonimização com storage e banco consistentes;
8. ser restaurada acidentalmente por um backup antigo e novamente eliminada pelo ledger antes de
   qualquer acesso;
9. deixar uma trilha operacional suficiente para provar o resultado sem preservar a identidade que
   deveria ter sido removida.
