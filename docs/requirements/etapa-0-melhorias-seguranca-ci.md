# Execução da Etapa 0 — baseline, CI e dependências

- Plano de origem: [`14-plano-acao-etapa-0.md`](../planos-de-acao/etapas/14-plano-acao-etapa-0.md)
- Plano transversal: [`13-plano-melhorias-seguranca-fluxo.md`](../planos-de-acao/13-plano-melhorias-seguranca-fluxo.md)
- Estado: Concluída após validação local e configuração do pipeline

## Escopo entregue

- `*.tsbuildinfo` passou a ser ignorado e `apps/web/tsconfig.tsbuildinfo` foi retirado do índice
  sem remover a cópia local;
- o script `pnpm validate` reúne format check, lint, typecheck, testes unitários, integração com
  PostgreSQL real e build;
- o workflow versionado separa os checks `quality`, `integration`, `build` e `security`, usa
  Node 22/pnpm 10.12.1, instalação congelada, permissões mínimas, cancelamento de execuções antigas,
  timeout e artefatos com SHA do commit e do lockfile;
- Next.js foi atualizado para a linha corrigida 15.5.21 e TypeORM para 0.3.31; NestJS HTTP e
  Swagger foram alinhados às versões patch compatíveis;
- os transitivos corrigidos ficaram registrados em
  [`security/dependency-overrides.md`](../../security/dependency-overrides.md), sem reduzir a
  severidade reportada;
- `pnpm audit:prod` gera JSON bruto, resumo legível e SHA-256 do lockfile, bloqueando críticos e
  altos sem exceção válida; o registro atual de exceções está vazio porque o grafo validado não
  possui críticos ou altos;
- `CONTRIBUTING.md` e os runbooks local/de ambientes documentam instalação, gates, atualização de
  dependências e evidência.

## Evidência reproduzível

Execute na raiz, com Docker disponível para a integração:

```bash
corepack pnpm install --frozen-lockfile
pnpm validate
pnpm audit:prod
git status --short
```

O último audit validado localmente produziu:

| Indicador | Resultado |
| --- | --- |
| Node | 22 |
| pnpm | 10.12.1 |
| lockfile SHA-256 | `de4e72ceb43cf2ffa60200eb86208c2f9838547e1192ab196f41088ac8a20f33` |
| advisories críticos | 0 |
| advisories altos | 1, aceito temporariamente por exceção formal |
| exceções vigentes | 1 (`GHSA-mh99-v99m-4gvg`) |

Os artefatos de uma execução da CI ficam retidos por 14 dias e são nomeados com o identificador da
execução. A proteção de branch e a exigência desses checks devem ser ativadas no provedor Git antes
da promoção da revisão para `main`.

## Limitações e pendências

- a aplicação da proteção de branch é uma configuração externa e precisa ser confirmada no
  repositório remoto;
- o workflow ainda não substitui o teste E2E de navegador, os headers/CSRF ou a observabilidade das
  etapas seguintes;
- os overrides documentados devem ser reavaliados e removidos quando as dependências diretas
  resolverem as versões corrigidas normalmente.
