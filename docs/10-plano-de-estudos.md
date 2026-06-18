# Plano de Estudos para Desenvolver o Vale Project

Este plano acompanha o `09-plano-de-acao.md` e explica o que estudar para entender cada decisao tecnica antes de implementar a proxima fatia do MVP.

## Como usar

Estude em ciclos curtos:

1. Leia a decisao tecnica.
2. Execute o projeto localmente.
3. Altere um pequeno trecho.
4. Rode lint, testes e build.
5. Escreva uma nota curta explicando o que mudou e por que.

## Ciclo 1: Fundacao do monorepo

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| pnpm workspaces | Monorepo, dependencias por pacote e scripts recursivos. | Rodar `pnpm --recursive build` e observar a ordem dos pacotes. |
| TypeScript strict | Tipagem estatica, inferencia, unions e contratos. | Criar um novo enum publico em `packages/shared` e usar na web. |
| ESLint e Prettier | Diferenca entre regra de codigo e formatacao. | Quebrar uma regra de lint, rodar `pnpm lint` e corrigir. |
| CI inicial | Pipeline, reproducibilidade e feedback rapido. | Ler `.github/workflows/ci.yml` e explicar cada etapa. |

## Ciclo 2: API base com NestJS

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| NestJS modular | Modules, controllers, providers e injecao de dependencia. | Criar um endpoint simples dentro de um novo modulo `version`. |
| DTOs e ValidationPipe | Entrada confiavel, whitelist e rejeicao de campos extras. | Criar um DTO com `class-validator` e testar campo invalido. |
| Swagger | Contratos HTTP e documentacao automatica. | Abrir `/docs` e localizar o contrato do health check. |
| Config tipada | Variaveis de ambiente, defaults e validacao com Zod. | Remover uma env obrigatoria e observar o erro de inicializacao. |

## Ciclo 3: Banco de dados e migrations

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| PostgreSQL | Tabelas, indices, constraints e extensoes. | Subir o banco com `pnpm db:up` e conectar pelo cliente de sua preferencia. |
| TypeORM | DataSource, entities, repositories e migrations. | Criar uma migration pequena e reverter em ambiente local. |
| Sem synchronize em producao | Controle de mudancas no schema. | Explicar por que `synchronize: false` evita risco operacional. |

## Ciclo 4: Frontend base com Next.js

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| App Router | Layouts, pages, server components e client components. | Criar uma pagina `/status` que consuma o health da API. |
| Design foundation | Tokens, responsividade e acessibilidade. | Ajustar uma cor mantendo contraste legivel. |
| Cliente HTTP tipado | Fetch, tratamento de erro e validacao de resposta. | Simular resposta invalida no teste de `getApiHealth`. |

## Ciclo 5: Identidade, termos e RBAC

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| Argon2 | Hash de senha, salt e custo computacional. | Comparar hash de senha com criptografia reversivel. |
| JWT curto + refresh token | Sessao, expiracao, rotacao e revogacao. | Desenhar o fluxo login, refresh e logout. |
| Cookie HttpOnly | XSS, CSRF, SameSite e Secure. | Explicar por que token no localStorage aumenta risco. |
| RBAC no backend | Guard, decorator e fonte de verdade da autorizacao. | Criar teste que bloqueia role incorreta. |
| TermsAcceptance | Consentimento, versao e rastreabilidade. | Modelar a tabela antes de escrever a entity. |

## Ciclo 6: Perfis e privacidade

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| Dados minimos | Necessidade, finalidade e reducao de coleta. | Revisar campos do perfil e marcar quais sao opcionais. |
| JSONB no MVP | Flexibilidade inicial versus normalizacao. | Criar exemplos de `skills` e `experiences` em JSON. |
| Visibilidade | Autorizacao por recurso e privacidade contextual. | Escrever casos de teste para cada nivel de visibilidade. |
| Upload adapter | Interface, implementacao local e troca futura por S3/R2. | Definir o contrato de upload sem acoplar ao provedor. |

## Ciclo 7: Vagas, busca e candidatura

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| Moderacao previa | Estados, transicoes e trilha de decisao. | Desenhar a maquina de estados de uma vaga. |
| Busca PostgreSQL | Indices, `ILIKE`, paginacao e filtros. | Criar uma query paginada apenas com vagas aprovadas. |
| Candidatura unica | Constraint composta e regra no service. | Testar tentativa de candidatura duplicada. |
| Dados visiveis ao contratante | Projecao de resposta e minimo necessario. | Criar DTO publico sem expor curriculo indevido. |

## Ciclo 8: Denuncias, auditoria e operacao

| Decisao | O que estudar | Pratica sugerida |
|---|---|---|
| Reports | Fluxo de denuncia, status e prioridade. | Criar cenarios de abuso e como o sistema deve responder. |
| ModerationDecision | Motivo, autor, alvo e data. | Escrever teste para decisao sem motivo ser rejeitada. |
| AuditLog | Evento sensivel sem segredos. | Definir metadata segura para troca de role. |
| Admin minimo | Escopo operacional essencial. | Separar o que entra no piloto do que fica para depois. |

## Definicao de pronto para estudante

Antes de considerar um ciclo entendido, a pessoa estudante deve conseguir:

| Evidencia | Exemplo |
|---|---|
| Explicar | Dizer por que a decisao foi tomada no contexto do Vale Project. |
| Executar | Rodar o comando local relacionado sem copiar cegamente. |
| Alterar | Fazer uma pequena mudanca coerente no codigo. |
| Testar | Provar que a mudanca funciona ou que uma regra falha corretamente. |
| Documentar | Registrar a conclusao em poucas linhas. |

## Ordem recomendada

1. Fundacao do monorepo.
2. API base.
3. Banco e migrations.
4. Frontend base.
5. Identidade e RBAC.
6. Perfis e privacidade.
7. Vagas e candidaturas.
8. Denuncias e auditoria.

Essa ordem acompanha a maturidade do produto: primeiro executar com qualidade, depois proteger identidade, depois entregar valor de vaga e candidatura, e por fim fechar governanca operacional.
