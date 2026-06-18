# Testes e Qualidade

## Objetivo

Garantir que os fluxos criticos do MVP sejam confiaveis, seguros e evoluam com baixo risco.

## Piramide de testes

| Tipo | Foco | Ferramentas sugeridas |
|---|---|---|
| Unitarios | Regras de negocio, services, validators e guards. | Jest |
| Integracao | Controllers, banco, repositories e modulos NestJS. | Jest, Supertest, Testcontainers |
| E2E | Fluxos reais de usuario entre frontend e backend. | Playwright ou Cypress |
| Acessibilidade | Navegacao, labels, contraste e teclado. | Testing Library, axe |

## Fluxos criticos para cobertura

| ID | Fluxo | Cobertura esperada |
|---|---|---|
| TQ-01 | Cadastro de candidato | Criacao de conta, papel correto, aceite de termos e onboarding. |
| TQ-02 | Cadastro de contratante | Criacao de conta, perfil do contratante e bloqueio antes do aceite. |
| TQ-03 | Login e refresh token | Autenticacao, expiracao e renovacao segura. |
| TQ-04 | RBAC | Bloqueio de rotas e endpoints para papeis incorretos. |
| TQ-05 | Criacao de vaga | Validacoes, status inicial e permissao do contratante. |
| TQ-06 | Moderacao de vaga | Aprovacao, rejeicao, motivo e auditoria. |
| TQ-07 | Busca de vagas | Filtros, paginacao e exibicao apenas de vagas aprovadas. |
| TQ-08 | Candidatura | Candidatura unica, status inicial e visibilidade ao contratante. |
| TQ-09 | Denuncia | Criacao, fila de analise e decisao de moderacao. |
| TQ-10 | Privacidade | Restricao de curriculo e dados sensiveis. |

## Criterios de qualidade

| Area | Criterio |
|---|---|
| Backend | Controllers finos, services com regra de negocio e guards testados. |
| Frontend | Componentes acessiveis, estados de loading/erro e formularios validados. |
| Banco | Migrations versionadas e indices para filtros comuns. |
| API | Contratos documentados e respostas de erro padronizadas. |
| CI | Rodar lint, testes unitarios, testes de integracao e build. |

## Exemplos de criterios de aceite

| Historia | Criterios |
|---|---|
| Como candidato, quero me cadastrar | Deve criar usuario com papel `candidate`; deve exigir aceite de termos; deve redirecionar para onboarding de candidato. |
| Como contratante, quero publicar vaga | Deve exigir e-mail confirmado; deve validar campos obrigatorios; deve criar vaga em `pending_review`. |
| Como coordenador, quero aprovar vaga | Deve exigir papel autorizado; deve alterar status para `approved`; deve gerar log de auditoria. |
| Como candidato, quero me candidatar | Deve impedir candidatura duplicada; deve permitir apenas vagas aprovadas e ativas; deve registrar data da candidatura. |

## Definicao de pronto

Uma funcionalidade so deve ser considerada pronta quando:

| Criterio | Obrigatorio |
|---|---|
| Requisito implementado conforme regra de negocio | Sim |
| Testes unitarios dos services principais | Sim |
| Testes de integracao para endpoints criticos | Sim |
| Validacao de autorizacao no backend | Sim |
| Tratamento de erro e feedback de usuario | Sim |
| Migrations revisadas | Sim |
| Documentacao atualizada quando houver mudanca de contrato | Sim |
