# Seguranca e LGPD

## Objetivo

Garantir que a plataforma seja segura por padrao e trate dados pessoais e sensiveis de forma proporcional, transparente e alinhada aos principios da LGPD.

## Dados sensiveis

Algumas informacoes relacionadas ao publico da plataforma podem ser sensiveis. O produto deve evitar coletar mais do que o necessario e deve explicar finalidade, visibilidade e uso.

| Tipo de dado | Diretriz |
|---|---|
| Nome social | Deve ser permitido e tratado como nome de exibicao quando o usuario desejar. |
| Pronomes | Opcional e controlado pelo usuario. |
| Identidade de genero | Opcional, com consentimento explicito e finalidade clara. |
| Orientacao sexual | Evitar coletar no MVP, salvo necessidade muito bem justificada. |
| Curriculo | Proteger acesso conforme regra de visibilidade. |
| Denuncias | Acesso restrito a coordenadores/admins e logs adequados. |

## Autenticacao

| Item | Diretriz |
|---|---|
| Senha | Hash com Argon2 ou bcrypt. |
| Access token | Curta duracao. |
| Refresh token | Rotacionavel, revogavel e armazenado com hash. |
| Recuperacao de senha | Token de uso unico e expiracao curta. |
| Verificacao de e-mail | Obrigatoria antes de acoes sensiveis. |

## Autorizacao

| Camada | Diretriz |
|---|---|
| Backend | Guards por autenticacao, papel e propriedade do recurso. |
| Frontend | Protecao de rotas e ocultacao de acoes nao permitidas. |
| Banco | Consultas sempre filtradas por escopo do usuario quando aplicavel. |

## Controle de acesso por recurso

| Recurso | Regra de acesso |
|---|---|
| Perfil de candidato | Dono acessa tudo; contratante acessa conforme candidatura ou visibilidade; equipe interna acessa apenas por necessidade operacional. |
| Curriculo em arquivo | Acesso autenticado e autorizado; evitar URL publica permanente. |
| Vaga | Dono gerencia; candidatos visualizam apenas vagas aprovadas e ativas; coordenadores moderam. |
| Denuncia | Autor pode acompanhar status limitado; equipe interna ve detalhes. |
| Auditoria | Restrita a admin e acesso parcial para coordenador quando necessario. |

## Praticas de implementacao

| Area | Recomendacao |
|---|---|
| Validacao | DTOs no NestJS e validacao tambem no frontend. |
| Sanitizacao | Tratar campos ricos ou impedir HTML livre no MVP. |
| Upload | Validar MIME real, extensao, tamanho e escanear quando possivel. |
| Segredos | Usar variaveis de ambiente e nunca versionar `.env`. |
| Logs | Redigir tokens, senhas, documentos e dados sensiveis. |
| Rate limit | Aplicar em login, cadastro, reset de senha, envio de e-mail e denuncia. |
| Auditoria | Registrar eventos sensiveis com metadata minima. |

## Direitos do titular

| Direito | Suporte no produto |
|---|---|
| Confirmacao e acesso | Usuario pode solicitar copia dos dados. |
| Correcao | Usuario pode editar dados do perfil. |
| Exclusao | Usuario pode solicitar exclusao ou anonimizar conta. |
| Revogacao de consentimento | Usuario pode remover consentimentos opcionais. |
| Portabilidade | Exportacao futura em formato estruturado. |

## Riscos principais

| Risco | Mitigacao |
|---|---|
| Exposicao indevida de curriculos | Autorizacao por recurso, URLs temporarias e auditoria. |
| Discriminacao em vagas | Moderacao, denuncias, diretrizes e bloqueio de termos inadequados. |
| Abuso de cadastro por contratantes | Verificacao de e-mail, limite inicial de vagas e verificacao administrativa futura. |
| Vazamento em logs | Politica de redacao e revisao de logs. |
| Coleta excessiva de dados sensiveis | Campos opcionais, justificativa de finalidade e minimizacao. |
