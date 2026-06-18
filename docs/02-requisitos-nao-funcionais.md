# Requisitos Nao Funcionais

## Seguranca

| ID | Requisito |
|---|---|
| RNF-01 | Senhas devem ser armazenadas com hash forte, preferencialmente Argon2 ou bcrypt com custo adequado. |
| RNF-02 | O sistema deve usar tokens de acesso de curta duracao e refresh tokens rotacionaveis. |
| RNF-03 | Refresh tokens devem ser armazenados de forma segura e poder ser invalidados individualmente. |
| RNF-04 | Endpoints publicos sensiveis devem ter rate limiting, especialmente login, cadastro e recuperacao de senha. |
| RNF-05 | O backend deve validar entradas com DTOs e pipes do NestJS. |
| RNF-06 | O acesso ao banco deve usar queries parametrizadas via TypeORM, evitando SQL Injection. |
| RNF-07 | O frontend deve aplicar protecoes contra XSS e evitar renderizacao insegura de HTML. |
| RNF-08 | O sistema deve usar CORS restritivo e headers de seguranca em producao. |
| RNF-09 | Uploads devem validar tipo, tamanho, extensao, conteudo e destino de armazenamento. |
| RNF-10 | A autorizacao deve ser aplicada no backend mesmo quando o frontend ocultar funcionalidades. |

## Privacidade e LGPD

| ID | Requisito |
|---|---|
| RNF-11 | Dados sensiveis devem ser opcionais e tratados com consentimento explicito. |
| RNF-12 | A plataforma deve aplicar minimizacao de dados, coletando apenas o necessario para a finalidade declarada. |
| RNF-13 | Usuarios devem conseguir solicitar exportacao, correcao e exclusao de dados pessoais. |
| RNF-14 | Exclusao de conta deve remover ou anonimizar dados pessoais conforme necessidade legal e operacional. |
| RNF-15 | Logs nao devem armazenar senha, token, documentos completos ou dados sensiveis desnecessarios. |

## Performance

| ID | Requisito |
|---|---|
| RNF-16 | Listagens devem usar paginacao obrigatoria. |
| RNF-17 | Campos usados em filtros frequentes devem possuir indices no PostgreSQL. |
| RNF-18 | APIs de leitura comuns devem responder preferencialmente abaixo de 300 ms em carga normal. |
| RNF-19 | Busca de vagas deve ser otimizada para palavras-chave e filtros combinados. |
| RNF-20 | Operacoes pesadas, como envio de e-mail, devem ser executadas de forma assincrona quando possivel. |

## Usabilidade e acessibilidade

| ID | Requisito |
|---|---|
| RNF-21 | A interface deve ser responsiva para desktop e mobile. |
| RNF-22 | A aplicacao deve seguir boas praticas WCAG, incluindo contraste, foco visivel, labels e navegacao por teclado. |
| RNF-23 | A linguagem deve ser inclusiva, clara e sem pressupor genero. |
| RNF-24 | Campos sensiveis devem explicar por que a informacao e solicitada e como sera usada. |
| RNF-25 | Erros de validacao devem ser objetivos, acessiveis e nao constrangedores. |

## Manutenibilidade

| ID | Requisito |
|---|---|
| RNF-26 | O backend deve ser modularizado por dominios: auth, users, profiles, jobs, applications, moderation e audit. |
| RNF-27 | O banco deve evoluir por migrations versionadas do TypeORM. |
| RNF-28 | Sincronizacao automatica do TypeORM nao deve ser usada em producao. |
| RNF-29 | Contratos de API devem ser documentados com OpenAPI/Swagger. |
| RNF-30 | Regras de negocio devem ficar em services/use cases, evitando concentracao em controllers. |
| RNF-31 | O frontend deve separar componentes de UI, hooks, servicos de API e validacoes. |

## Observabilidade

| ID | Requisito |
|---|---|
| RNF-32 | Logs estruturados devem registrar eventos relevantes sem expor segredos. |
| RNF-33 | Erros nao tratados devem ser capturados por camada global de exception handling. |
| RNF-34 | O sistema deve expor health checks para banco de dados e servicos dependentes. |
| RNF-35 | A aplicacao deve manter trilhas de auditoria para acoes sensiveis. |
