# Plano de ação da Etapa 0 — baseline, CI e dependências

- Data do levantamento: 2026-07-26
- Plano de origem:
  [`13-plano-melhorias-seguranca-fluxo.md`](../13-plano-melhorias-seguranca-fluxo.md)
- Estado: concluído em 2026-07-26; ver [registro de execução](../../requirements/etapa-0-melhorias-seguranca-ci.md)
- Tamanho estimado: M, de três a cinco dias de trabalho, além do tempo de revisão

## Resultado esperado

Ao final desta etapa, todo commit candidato à `main` deve ser validado por um pipeline versionado
que:

1. instala exatamente o grafo descrito no lockfile;
2. executa formatação, lint, tipos, testes unitários, integração e build;
3. bloqueia vulnerabilidades críticas ou altas de produção que não tenham exceção válida;
4. publica evidências relacionadas ao SHA do commit e ao hash do lockfile;
5. termina sem modificar arquivos versionados.

O marco de conclusão é uma revisão integrada por esse mesmo pipeline, com todos os checks
obrigatórios verdes e sem alerta crítico ou alto não aceito.

## Baseline verificada

| Item | Estado atual | Lacuna a fechar |
| --- | --- | --- |
| CI | `.github/workflows/ci.yml` já está versionado | faltam `format:check`, `typecheck`, integração, audit, artefatos e proteção da branch |
| Instalação | usa `pnpm install --frozen-lockfile` e Node 22 | fixar a ativação do pnpm declarado no projeto e registrar as versões na evidência |
| Qualidade | scripts de formatação, lint, tipos, testes e build existem na raiz | não há um comando único que reproduza todos os gates sem o audit |
| Integração | `pnpm test:integration` executa 21 testes com PostgreSQL real | o comando ainda não participa da CI |
| Audit | 20 alertas de produção: 10 altos, 9 moderados e 1 baixo | não existe triagem versionada nem gate por severidade |
| Lockfile | `pnpm-lock.yaml` está versionado | seu hash não é publicado junto dos resultados |
| Arquivo gerado | `apps/web/tsconfig.tsbuildinfo` está versionado | typecheck ou build pode sujar o worktree |

O workflow existente deve ser ampliado, não substituído por uma segunda solução de CI.

## Decisões de execução

- manter Node 22 e pnpm 10.12.1 nesta etapa;
- não incluir upgrades de versão principal, como Next.js 16, TypeORM 1 ou Zod 4;
- atualizar uma família de dependências por revisão e conferir o diff do lockfile;
- não executar `pnpm audit --fix` ou `audit fix --force` sem analisar cada override;
- tratar falha de acesso ao registry como falha do gate, não como sucesso;
- permitir exceção apenas para um advisory específico, com alcance, compensação, responsável,
  rastreamento e validade;
- limitar o escopo a CI, supply chain, evidência e higiene do repositório; mudanças de sessão,
  headers e funcionalidades começam na Etapa 1.

## Sequência de entregas

### Entrega 0.1 — baseline reproduzível e higiene

Objetivo: preparar comandos e arquivos para que ambiente local e CI executem a mesma validação.

Mudanças:

- adicionar `*.tsbuildinfo` ao `.gitignore`;
- retirar `apps/web/tsconfig.tsbuildinfo` apenas do índice do Git, preservando sua geração local;
- adicionar um script raiz `validate` com `format:check`, `lint`, `typecheck`, `test`,
  `test:integration` e `build`;
- adicionar um script `audit:prod` para a política de segurança descrita na Entrega 0.4;
- documentar em `CONTRIBUTING.md` os comandos, a versão de Node/pnpm e o fluxo de atualização do
  lockfile;
- executar o conjunto completo e confirmar com `git status --short` que nenhum arquivo versionado
  foi alterado.

Critérios de aceite:

- uma instalação limpa com `pnpm install --frozen-lockfile` funciona;
- `pnpm validate` representa todos os gates funcionais da etapa;
- duas execuções consecutivas produzem o mesmo estado e deixam o worktree limpo;
- a remoção do `tsconfig.tsbuildinfo` não altera o comportamento do typecheck ou do build.

Tamanho: S.

### Entrega 0.2 — ampliar o pipeline obrigatório

Objetivo: executar automaticamente todos os gates funcionais já disponíveis.

Alterar `.github/workflows/ci.yml` para ter checks identificáveis:

| Check | Comandos mínimos | Observação |
| --- | --- | --- |
| `quality` | install, `format:check`, `lint`, `typecheck`, `test` | falha rápida para feedback de código |
| `integration` | install, `test:integration` | PostgreSQL 16 isolado; timeout explícito |
| `build` | install, `build` | executado sobre o mesmo SHA e lockfile |
| `security` | install, `audit:prod` | começa informativo e vira obrigatório na Entrega 0.4 |

Controles adicionais:

- definir `permissions: contents: read`;
- cancelar execuções antigas da mesma revisão com `concurrency`;
- configurar timeout por job;
- usar instalação congelada em todos os jobs;
- registrar Node, pnpm, SHA do commit e SHA-256 do `pnpm-lock.yaml`;
- publicar os relatórios em artefato mesmo quando um gate falhar;
- manter segredos fora de comandos, logs, fixtures e artefatos.

Para não deixar a `main` permanentemente vermelha, o check `security` será informativo somente
durante as Entregas 0.2 e 0.3. Essa transição termina na Entrega 0.4 e não atende, isoladamente, ao
marco da etapa.

Configuração externa no provedor Git:

- exigir revisão por pull request;
- marcar `quality`, `integration`, `build` e, após a Entrega 0.4, `security` como checks
  obrigatórios;
- impedir integração quando um check obrigatório estiver ausente, cancelado ou falhar;
- registrar a configuração aplicada como evidência operacional.

Critérios de aceite:

- uma mudança proposital de formato, tipo ou teste demonstra que o check correspondente bloqueia;
- os 21 testes de integração executam na CI com PostgreSQL real;
- o build de shared, API e web passa no runner limpo;
- cada artefato identifica inequivocamente o commit e o lockfile analisados.

Tamanho: M.

### Entrega 0.3 — atualização das dependências em lotes

Objetivo: eliminar alertas corrigíveis sem misturar migrações de versão principal.

#### Lote A — dependências diretas

| Dependência | Atual | Alvo mínimo | Validação específica |
| --- | --- | --- | --- |
| Next.js | 15.5.19 | 15.5.21 | build web e smoke das rotas públicas, autenticadas e administrativas |
| TypeORM | 0.3.30 | 0.3.31 | migrations desde base vazia e toda a suíte de integração |

Esse lote deve conter somente os manifests, lockfile e adaptações indispensáveis aos patches.

#### Lote B — NestJS e transitivos

| Família | Movimento inicial | Resultado esperado |
| --- | --- | --- |
| NestJS HTTP | alinhar common, core e platform-express em 11.1.28 | Multer 2.2.0 no grafo |
| Swagger | atualizar 11.4.4 para 11.4.6 | `js-yaml` corrigido no grafo |
| Integração TypeORM | atualizar `@nestjs/typeorm` dentro da linha 11 | manter pares suportados e testes verdes |
| Body parser | adotar 2.3.0 por resolução normal ou override mínimo | remover o alerta baixo conhecido |

#### Lote C — transitivos sem resolução compatível direta

| Dependência | Situação | Ação |
| --- | --- | --- |
| PostCSS | Next.js 15.5.21 ainda declara 8.4.31 | testar override mínimo para 8.5.18 e validar build/CSS |
| Sharp | Next.js 15 declara `^0.34.3`, mas o audit pede 0.35.0 | não forçar sem teste; como não há uso de `next/image`, documentar alcance e expiração se a exceção for necessária |
| brace-expansion | TypeORM chega por `glob`/`minimatch`; um alerta pede 2.1.2 e outro 5.0.8 | aplicar somente resolução compatível testada; para o restante, provar que padrões não recebem entrada do usuário e abrir rastreamento upstream |

Cada lote deve:

1. registrar versões antes e depois com `pnpm why`;
2. revisar os changelogs dos pacotes diretos;
3. conferir manualmente o diff de `pnpm-lock.yaml`;
4. executar `pnpm validate`;
5. executar `pnpm audit --prod --json`;
6. ser revertível pela reversão de sua própria revisão.

Critérios de aceite:

- Next.js e TypeORM atingem ao menos as versões corrigidas indicadas;
- Multer e `js-yaml` deixam de aparecer em versões vulneráveis;
- overrides possuem comentário ou registro que explica causa, compatibilidade e condição de remoção;
- nenhum lote introduz versão principal de framework;
- toda a suíte permanece verde.

Tamanho: M, dividido em duas ou três revisões.

### Entrega 0.4 — política de audit e gate bloqueante

Objetivo: transformar a triagem em uma regra verificável, sem depender de interpretação manual dos
logs.

Criar um registro versionado de exceções com, no mínimo:

| Campo | Regra |
| --- | --- |
| advisory | CVE ou GHSA exato, sem curinga |
| pacote e caminho | versão encontrada e caminho completo no grafo |
| severidade | valor observado no relatório |
| alcance | explicação de como o código vulnerável seria atingido e resultado da análise local |
| mitigação | controle compensatório verificável |
| responsável | pessoa responsável por acompanhar a remoção |
| rastreamento | issue ou tarefa com próximo passo |
| validade | data de expiração curta; sugestão máxima de 30 dias |

O script `audit:prod` deve:

1. gerar o JSON bruto de `pnpm audit --prod`;
2. falhar para todo alerta crítico ou alto sem exceção vigente;
3. falhar para exceção expirada, incompleta ou que não corresponda ao grafo atual;
4. exibir alertas moderados e baixos sem bloqueá-los inicialmente;
5. falhar quando o registry não responder;
6. produzir um resumo legível e o relatório bruto para publicação.

As exceções não reduzem a severidade do advisory. Elas apenas registram uma aceitação temporária,
com compensação e prazo.

Critérios de aceite:

- um advisory alto fictício ou não listado faz o check `security` falhar;
- uma exceção expirada faz o check falhar;
- uma exceção válida aparece nominalmente no resumo;
- o check `security` deixa de ser informativo e passa a ser obrigatório na `main`;
- não existe alerta crítico ou alto fora do registro de exceções vigente.

Tamanho: M.

### Entrega 0.5 — evidência e encerramento

Objetivo: demonstrar que o próprio mecanismo criado promoveu a entrega.

O artefato final deve conter:

- SHA do commit;
- versões de Node, pnpm e sistema do runner;
- SHA-256 do `pnpm-lock.yaml`;
- resultado de cada check;
- relatório JSON do audit e resumo das exceções;
- data e identificador da execução;
- retenção suficiente para relacionar o artefato à revisão.

Atualizar o registro de execução da etapa somente depois de:

- todos os checks obrigatórios passarem no commit final;
- a proteção de branch estar ativa;
- as exceções restantes terem responsável, mitigação, tarefa e validade;
- o worktree ficar limpo após uma validação local completa;
- a revisão final ser integrada pelo pipeline, sem bypass.

Tamanho: S.

## Ordem de pull requests

| Ordem | Escopo | Depende de | Pode ser integrado quando |
| --- | --- | --- | --- |
| PR 1 | higiene, scripts e documentação de contribuição | nenhuma | validação local completa e worktree limpo |
| PR 2 | CI funcional e artefatos; audit ainda informativo | PR 1 | quality, integração e build passam no runner |
| PR 3 | Next.js e TypeORM | PR 2 | suíte completa e audit melhor ou igual |
| PR 4 | NestJS, Swagger e transitivos compatíveis | PR 3 | alertas corrigíveis removidos e suíte verde |
| PR 5 | exceções temporárias justificadas e gate bloqueante | PR 4 | nenhum crítico/alto fica fora da política |
| PR 6 | proteção de branch e evidência final | PR 5 | o próprio pipeline aprova o commit promovido |

PRs 3 e 4 não devem ser agrupados se o diff do lockfile impedir atribuir uma regressão a uma
família de dependências.

## Matriz mínima de validação

| Cenário | Comando ou evidência | Resultado |
| --- | --- | --- |
| instalação | `pnpm install --frozen-lockfile` | nenhuma atualização do lockfile |
| estilo | `pnpm format:check` e `pnpm lint` | ambos passam |
| contratos | `pnpm typecheck` e `pnpm test` | tipos e testes passam |
| banco e fluxos | `pnpm test:integration` | 21 ou mais testes passam com PostgreSQL real |
| artefatos | `pnpm build` | shared, API e web compilam |
| supply chain | `pnpm audit --prod --json` mais política | zero crítico/alto não aceito |
| higiene | `git status --short` após a suíte | nenhum arquivo versionado novo ou modificado |
| bloqueio | revisão de teste com falha controlada | integração é impedida |

## Rollback

- CI: reverter somente a alteração do workflow se o runner estiver incorreto, mantendo os gates
  locais documentados; não usar bypass permanente;
- dependências diretas: reverter manifest e lockfile do lote afetado juntos;
- overrides: remover apenas o override responsável e regenerar o lockfile com pnpm 10.12.1;
- branch protection: remover temporariamente apenas um check comprovadamente defeituoso, com tarefa
  e prazo para restauração;
- exceções: nunca estender validade silenciosamente; uma prorrogação exige nova análise e revisão.

## Fora do escopo

- upgrade para Next.js 16, TypeORM 1 ou outras versões principais;
- Dependabot ou Renovate, salvo decisão separada após estabilizar o gate;
- SAST, DAST, secret scanning e SBOM;
- E2E de navegador;
- headers HTTP, CSRF, cookies, JWT e refresh do frontend;
- observabilidade da aplicação e retenção de dados.

Esses itens continuam nas etapas seguintes ou em melhorias complementares e não devem atrasar o
marco desta etapa.
