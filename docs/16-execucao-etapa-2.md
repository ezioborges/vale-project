# Execução da etapa 2 — continuidade de sessão e minimização de dados

## Decisões

- chamadas autenticadas do frontend passam por um único transporte em `lib/api`;
- respostas `401` iniciam um refresh single-flight e permitem apenas uma repetição da chamada
  original;
- respostas `403` não iniciam refresh e preservam o erro para a interface mostrar bloqueio ou ação
  necessária;
- falha de refresh limpa o estado de CSRF, emite o evento local `vale:session-ended`, recebe cookies
  expirados da API e redireciona para a entrada ou para a conta indisponível;
- o middleware Web não interpreta claims nem bloqueia pela presença de cookies, porque o refresh
  tem path restrito; os layouts protegidos consultam `/users/me` pelo transporte central, enquanto
  a API decide identidade, papel, estado e termos;
- erros HTTP usam `ApiRequestError` com um catálogo fechado de códigos; mensagens continuam sendo
  apenas conteúdo de apresentação;
- o access token contém `sub`, `authVersion` e `sid`, além das claims registradas de emissão,
  audiência e expiração.

## Contratos por audiência

O perfil de candidato possui três respostas:

| Audiência | Dados de arquivo |
| --- | --- |
| titular | avatar e currículo com metadados necessários para baixar, substituir ou excluir |
| equipe | metadados necessários para atuação administrativa, sem reutilizar o DTO do titular |
| terceiro autorizado | somente referência mínima do avatar; não recebe `userId`, estado de privacidade nem qualquer metadado do currículo corrente |

O currículo disponibilizado ao contratante continua sendo exclusivamente o snapshot da candidatura,
com autorização e auditoria próprias.

## Minimização e auditoria

- `passwordHash` usa `select: false`; somente o método de login adiciona a coluna explicitamente;
- respostas de usuário são montadas por allowlist e não serializam o hash;
- contextos de auditoria passam por allowlist específica para cada ação, limitam valores simples e
  descartam objetos aninhados;
- cadastro, login, refresh, logout, confirmação de e-mail e troca de senha registram resultado e
  motivo seguro quando existe uma conta-alvo conhecida;
- falhas para e-mails inexistentes mantêm a mesma resposta pública e não criam um identificador
  artificial que possa produzir enumeração.

## Evidência automatizada

Os testes cobrem:

- refresh único para requisições concorrentes, repetição máxima de uma vez e ausência de refresh em
  `403`;
- códigos estáveis de erro e validação dos contratos de resposta;
- middleware sem decodificação de JWT, layouts protegidos pela resposta confiável da API e
  continuidade quando resta apenas o cookie de refresh;
- seleção explícita do hash apenas no login e ausência do campo na leitura padrão;
- JWT sem e-mail, papel ou estado redundantes;
- respostas negativas de perfil para terceiro e metadados de ação disponíveis somente ao titular e
  à equipe;
- allowlist de auditoria bloqueando token, senha, conteúdo de bio, currículo e descrições;
- eventos de autenticação sem credenciais nem e-mail no contexto.

O gate de conclusão é `pnpm validate`, seguido por `pnpm audit:prod` e `git diff --check`.

## Resultado verificado em 2026-07-26

- `pnpm validate`: passou em formatação, lint, typecheck, 69 testes
  unitários/frontend/shared, 22 testes de integração com PostgreSQL e builds de shared, API e Web;
- `pnpm audit:prod`: política passou sem alerta crítico/alto bloqueante; permanece a exceção
  temporária válida de `brace-expansion` já documentada na etapa 0;
- `git diff --check`: passou sem erro de whitespace.
