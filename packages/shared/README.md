# Shared

Pacote para contratos e utilitarios compartilhados entre backend e frontend.

## Conteudos candidatos

| Tipo       | Exemplos                                                            |
| ---------- | ------------------------------------------------------------------- |
| Tipos      | Roles, status de vagas, status de candidaturas e enums publicos.    |
| Schemas    | Validacoes compartilhadas quando fizer sentido.                     |
| Constantes | Limites, formatos e mensagens comuns.                               |
| Contratos  | Tipos de request/response para reduzir divergencia entre API e web. |

## Cuidados

Este pacote nao deve concentrar regra de negocio sensivel. Regras de autorizacao, privacidade e moderacao devem continuar no backend.

## Comandos

```bash
pnpm --filter @vale/shared test
pnpm --filter @vale/shared build
```
