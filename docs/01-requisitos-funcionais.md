# Requisitos Funcionais

## Cadastro, autenticacao e autorizacao

| ID | Requisito |
|---|---|
| RF-01 | O sistema deve permitir cadastro publico apenas para os papeis `Contratante` e `Contratado`. |
| RF-02 | O sistema deve iniciar o cadastro com a escolha entre `Quero contratar` e `Quero encontrar oportunidades`. |
| RF-03 | A escolha feita no cadastro deve definir o papel inicial do usuario, o onboarding e o dashboard inicial. |
| RF-04 | O cadastro deve exigir nome, e-mail, senha, aceite dos termos de uso, politica de privacidade e diretrizes de inclusao. |
| RF-05 | O sistema deve validar e-mail unico para contas ativas. |
| RF-06 | O sistema deve enviar verificacao de e-mail antes de liberar funcionalidades sensiveis. |
| RF-07 | O sistema deve permitir login, logout, recuperacao de senha e renovacao segura de sessao. |
| RF-08 | O backend deve aplicar RBAC por guards e decorators no NestJS. |
| RF-09 | O frontend deve proteger rotas e componentes conforme papel e estado da conta. |
| RF-10 | Apenas `Admin` pode criar ou promover usuarios para `Admin` e `Coordenador`. |

## Fluxo de cadastro do Contratado

| ID | Requisito |
|---|---|
| RF-11 | O sistema deve coletar dados profissionais do candidato apos criacao da conta base. |
| RF-12 | O sistema deve permitir informar nome social, pronomes, localidade, bio profissional, areas de interesse e modalidade desejada. |
| RF-13 | Informacoes relacionadas a identidade de genero, orientacao sexual ou pertencimento a grupos especificos devem ser opcionais. |
| RF-14 | O candidato deve poder cadastrar experiencias, formacao, habilidades, links profissionais e curriculo em arquivo. |
| RF-15 | O candidato deve poder definir se o perfil fica visivel para contratantes verificados ou apenas para vagas nas quais se candidatou. |

## Fluxo de cadastro do Contratante

| ID | Requisito |
|---|---|
| RF-16 | O sistema deve coletar dados do contratante apos criacao da conta base. |
| RF-17 | O contratante deve informar se atua como empresa, organizacao ou pessoa fisica. |
| RF-18 | O sistema deve coletar nome do responsavel, contato, nome da organizacao quando aplicavel, segmento, localidade e descricao institucional. |
| RF-19 | O contratante deve aceitar diretrizes especificas de diversidade, inclusao e nao discriminacao antes de publicar vagas. |
| RF-20 | O sistema deve permitir marcar contratantes como verificados por acao administrativa futura. |

## Perfis

| ID | Requisito |
|---|---|
| RF-21 | O candidato deve poder criar, editar, ativar, desativar e revisar o proprio perfil. |
| RF-22 | O contratante deve poder criar e editar perfil institucional. |
| RF-23 | O sistema deve permitir upload de avatar ou imagem institucional, respeitando regras de seguranca. |
| RF-24 | O sistema deve manter historico minimo de atualizacoes sensiveis de perfil. |

## Vagas

| ID | Requisito |
|---|---|
| RF-25 | O contratante deve poder criar, editar, pausar, encerrar e republicar vagas. |
| RF-26 | A vaga deve conter titulo, descricao, localidade, modalidade, regime, senioridade, requisitos, beneficios e informacoes de acessibilidade. |
| RF-27 | O sistema deve permitir informar faixa salarial ou justificar ausencia dessa informacao, conforme regra definida pela plataforma. |
| RF-28 | Vagas novas devem iniciar como `pendente` quando a moderacao previa estiver habilitada. |
| RF-29 | Vagas aprovadas devem ficar disponiveis para busca e candidatura. |
| RF-30 | Vagas rejeitadas devem exibir motivo ao contratante. |

## Busca e candidatura

| ID | Requisito |
|---|---|
| RF-31 | O candidato deve poder listar e buscar vagas aprovadas. |
| RF-32 | O candidato deve poder filtrar vagas por area, localidade, modalidade, regime, senioridade e palavras-chave. |
| RF-33 | O candidato deve poder visualizar detalhes completos de uma vaga aprovada. |
| RF-34 | O candidato deve poder se candidatar a uma vaga aprovada e ativa. |
| RF-35 | O candidato deve acompanhar o status de suas candidaturas. |
| RF-36 | O contratante deve visualizar candidaturas recebidas em suas vagas. |
| RF-37 | O contratante deve alterar status da candidatura dentro de um fluxo permitido. |

## Moderacao, denuncia e auditoria

| ID | Requisito |
|---|---|
| RF-38 | Usuarios autenticados devem poder denunciar vagas, perfis ou comportamentos inadequados. |
| RF-39 | Coordenadores devem acessar fila de denuncias com status, prioridade e historico. |
| RF-40 | Coordenadores devem aprovar, rejeitar, pausar ou solicitar ajustes em vagas. |
| RF-41 | Coordenadores devem poder suspender temporariamente conteudos inadequados. |
| RF-42 | Admins devem gerenciar usuarios, papeis, configuracoes globais e logs de auditoria. |
| RF-43 | Acoes sensiveis devem gerar evento de auditoria com usuario, data, tipo de acao e entidade afetada. |
