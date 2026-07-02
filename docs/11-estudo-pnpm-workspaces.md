# Estudo Dirigido: pnpm Workspaces

Este documento detalha a primeira linha do Ciclo 1 do `10-plano-de-estudos.md`: a decisão por `pnpm workspaces` na fundação do monorepo.

O objetivo é entender por que o Vale Project usa um único repositório com `apps/api`, `apps/web` e `packages/shared`, como o pnpm conecta esses pacotes e como validar essa base antes de seguir para as próximas decisões técnicas.

## Diagnóstico

O Vale Project precisa evoluir backend, frontend e contratos compartilhados sem duplicar tipos, scripts e configurações. Como o MVP ainda está em fase inicial, a prioridade é ter uma base simples, rápida e fácil de auditar.

Por isso, o monorepo com pnpm é uma escolha adequada: ele permite manter múltiplos projetos no mesmo repositório, instalar dependências de forma eficiente e executar comandos em todos os pacotes sem adicionar uma ferramenta de orquestração mais pesada no primeiro ciclo.

## Decisão Estudada

| Tema | Recomendação para MVP | Motivo |
| --- | --- | --- |
| Gerenciador de monorepo | pnpm workspaces | Simples, rápido e bom para apps + packages. |
| Estrutura inicial | `apps/*` e `packages/*` | Separa aplicações executáveis de bibliotecas compartilhadas. |
| Dependências internas | `workspace:*` | Garante que API e web usem o pacote local `@vale/shared`. |
| Scripts globais | `pnpm --recursive` | Permite rodar build, lint, testes e typecheck em todos os pacotes. |
| Versão do pnpm | `packageManager` + Corepack | Ajuda o time a usar a mesma versão do gerenciador. |

## Onde Isso Aparece no Projeto

| Arquivo | O que observar |
| --- | --- |
| `package.json` | `private: true`, `packageManager: pnpm@10.12.1` e scripts recursivos. |
| `pnpm-workspace.yaml` | Inclusão de `apps/*` e `packages/*` no workspace. |
| `apps/api/package.json` | Dependência local `@vale/shared` com `workspace:*`. |
| `apps/web/package.json` | Dependência local `@vale/shared` com `workspace:*`. |
| `packages/shared/package.json` | Pacote compartilhado com build, tipos e exports próprios. |
| `pnpm-lock.yaml` | Registro travado das dependências externas e internas. |

## Conteúdos para Estudar

Use esta lista como checklist. Marque cada item quando conseguir explicar a ideia com suas palavras e executar ao menos um comando relacionado no projeto.

| Status | Conteúdo | Documentação | Evidência esperada |
| --- | --- | --- | --- |
| [x] | Conceito de workspace no pnpm | [Workspace](https://pnpm.io/workspaces) | Explicar o que torna este repositório um workspace. |
| [x] | Arquivo `pnpm-workspace.yaml` | [pnpm-workspace.yaml](https://pnpm.io/pnpm-workspace_yaml) | Explicar por que `apps/*` e `packages/*` entram no monorepo. |
| [x] | Protocolo `workspace:` | [Workspace protocol](https://pnpm.io/workspaces#workspace-protocol-workspace) | Explicar por que `@vale/shared` não vem do npm registry. |
| [x] | Comandos recursivos | [pnpm -r, --recursive](https://pnpm.io/cli/recursive) | Rodar `pnpm --recursive build` e observar quais pacotes executam build. |
| [x] | Filtros por pacote | [Filtering](https://pnpm.io/filtering) | Rodar `pnpm --filter @vale/shared build` e comparar com o build recursivo. |
| [ ] | Scripts por pacote | [pnpm run](https://pnpm.io/cli/run) | Identificar quais scripts existem na raiz, API, web e shared. |
| [ ] | Lockfile e instalação reproduzível | [pnpm install](https://pnpm.io/cli/install) | Explicar por que o `pnpm-lock.yaml` deve ser versionado. |
| [ ] | Configurações do pnpm no workspace | [Settings](https://pnpm.io/settings) | Saber onde ficariam configurações futuras do pnpm. |
| [ ] | Corepack e `packageManager` | [Corepack](https://nodejs.org/api/corepack.html) | Explicar por que a raiz declara `pnpm@10.12.1`. |
| [ ] | Quando não adicionar outra ferramenta | [Catalogs](https://pnpm.io/catalogs) | Entender recursos nativos antes de trazer Nx/Turborepo. |

## Roteiro Prático

### 1. Ler a decisão no contexto do MVP

- [ ] Ler a linha `pnpm workspaces` em `docs/10-plano-de-estudos.md`.
- [ ] Ler `Gerenciador de monorepo` em `docs/09-plano-de-acao.md`.
- [ ] Ler a estrutura sugerida em `docs/04-arquitetura.md`.
- [ ] Escrever uma frase explicando por que o projeto precisa de `apps/api`, `apps/web` e `packages/shared`.

### 2. Inspecionar a configuração real

- [ ] Abrir `pnpm-workspace.yaml` e confirmar os globs configurados.
- [ ] Abrir `package.json` da raiz e localizar os scripts `dev`, `build`, `lint`, `test` e `typecheck`.
- [ ] Abrir `apps/api/package.json` e localizar `@vale/shared`.
- [ ] Abrir `apps/web/package.json` e localizar `@vale/shared`.
- [ ] Abrir `packages/shared/package.json` e localizar `main`, `types` e `exports`.

### 3. Executar comandos essenciais

- [ ] Rodar `pnpm install`.
- [ ] Rodar `pnpm --recursive build`.
- [ ] Rodar `pnpm --recursive test`.
- [ ] Rodar `pnpm --filter @vale/shared build`.
- [ ] Rodar `pnpm --filter @vale/api typecheck`.
- [ ] Rodar `pnpm --filter @vale/web typecheck`.

### 4. Entender a diferença entre raiz e pacotes

- [ ] Explicar por que `format` está na raiz.
- [ ] Explicar por que `build` existe em cada pacote.
- [ ] Explicar por que `db:up` está na raiz.
- [ ] Explicar por que `@vale/shared` é uma dependência de `apps/api` e `apps/web`, não apenas uma pasta importada por caminho relativo.

### 5. Fazer uma mudança pequena

- [ ] Criar ou alterar um tipo simples em `packages/shared`.
- [ ] Usar esse tipo em `apps/api` ou `apps/web`.
- [ ] Rodar `pnpm --recursive typecheck`.
- [ ] Reverter ou manter a mudança apenas se ela fizer sentido para o projeto.
- [ ] Registrar em uma nota curta o que mudou e por que o workspace ajudou.

## Perguntas que Você Deve Conseguir Responder

| Pergunta | Status |
| --- | --- |
| O que é um monorepo e qual problema ele resolve neste projeto? | [ ] |
| O que o arquivo `pnpm-workspace.yaml` define? | [ ] |
| Por que o root `package.json` tem `private: true`? | [ ] |
| O que `workspace:*` muda em relação a uma dependência publicada no npm? | [ ] |
| Qual é a diferença entre `pnpm --recursive build` e `pnpm --filter @vale/shared build`? | [ ] |
| Por que o `pnpm-lock.yaml` deve ser commitado? | [ ] |
| Quando faria sentido considerar Nx ou Turborepo depois? | [ ] |

## Critérios de Aceite do Estudo

| Critério | Validação |
| --- | --- |
| Entendeu a decisão | Consegue explicar por que pnpm workspaces foi suficiente para a Fase 0. |
| Leu a configuração | Consegue apontar os arquivos que definem o workspace. |
| Executou comandos | Rodou build, test ou typecheck por workspace e por pacote. |
| Entendeu dependências internas | Consegue explicar o uso de `workspace:*` em `@vale/shared`. |
| Fez uma prática pequena | Alterou algo simples e validou com typecheck ou build. |

## Riscos e Cuidados

| Risco | Como evitar |
| --- | --- |
| Instalar dependência no pacote errado | Antes de instalar, decidir se ela pertence à raiz, API, web ou shared. |
| Usar import por caminho relativo entre pacotes | Preferir dependência declarada e import por nome do pacote. |
| Rodar comando global sem necessidade | Usar `--filter` quando quiser validar apenas uma parte. |
| Esquecer o lockfile | Sempre versionar `pnpm-lock.yaml` junto com mudanças de dependências. |
| Adicionar orquestrador cedo demais | Primeiro dominar scripts recursivos e filtros nativos do pnpm. |

## Nota de Conclusão

Preencha quando terminar esta trilha:

```md
Data:

O que eu entendi:

Comandos que rodei:

Dúvidas que ficaram:

Próxima decisão técnica para estudar:
```
