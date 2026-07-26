# Contribuindo

## Ambiente

O projeto usa Node.js 22 e pnpm 10.12.1. Ative a versão declarada pelo `packageManager` com
Corepack e instale o grafo congelado:

```bash
corepack enable
pnpm install --frozen-lockfile
```

## Gates locais

Antes de abrir uma revisão, execute:

```bash
pnpm validate
pnpm audit:prod
```

`pnpm validate` executa formatação, lint, typecheck, testes unitários, integração com PostgreSQL
real e build. A integração precisa do Docker disponível e usa o serviço `postgres-test` na porta 5433.

`pnpm audit:prod` grava o JSON bruto e o resumo em `.data/audit/`, verifica o SHA-256 do lockfile e
bloqueia advisories críticos ou altos sem uma exceção vigente. Exceções devem usar um advisory
exato, caminho e versão encontrados no relatório, alcance, mitigação, responsável, rastreamento e
validade máxima de 30 dias. O registro versionado está em
[`security/audit-exceptions.json`](security/audit-exceptions.json).

## Atualizando dependências

Faça uma família por revisão. Use `pnpm why <pacote>` antes e depois, revise o changelog e o diff
de `pnpm-lock.yaml`, execute `pnpm validate` e `pnpm audit:prod`. Não use `audit fix --force` nem
introduza uma versão principal sem uma decisão separada.

Os overrides atualmente necessários estão documentados em
[`security/dependency-overrides.md`](security/dependency-overrides.md). Remova um override assim
que a dependência direta resolver a versão corrigida por meios normais.

## Higiene

Builds e typechecks podem gerar arquivos locais `*.tsbuildinfo`; eles são ignorados e não devem ser
adicionados ao commit. Ao modificar contratos de API, atualize os schemas compartilhados, testes,
documentação e migrations necessárias na mesma revisão.
