# Regras de Negocio

## Papeis e permissoes

| ID | Regra |
|---|---|
| RN-01 | O cadastro publico permite apenas os papeis `Contratante` e `Contratado`. |
| RN-02 | Apenas `Admin` pode atribuir, remover ou alterar papeis `Admin` e `Coordenador`. |
| RN-03 | `Coordenador` pode moderar conteudo e analisar denuncias, mas nao pode alterar configuracoes globais criticas. |
| RN-04 | Um usuario pode ter apenas um papel principal ativo no MVP. |
| RN-05 | Permissoes devem ser avaliadas no backend em toda operacao protegida. |

## Cadastro e aceite de termos

| ID | Regra |
|---|---|
| RN-06 | Todo usuario deve aceitar termos de uso, politica de privacidade e diretrizes de inclusao antes de usar funcionalidades principais. |
| RN-07 | O aceite deve registrar versao dos termos, data, usuario e metadados tecnicos minimos. |
| RN-08 | Mudanca relevante nos termos deve exigir novo aceite antes de candidatar-se ou publicar vaga. |
| RN-09 | O usuario deve confirmar e-mail antes de publicar vaga, candidatar-se ou acessar dados sensiveis. |
| RN-10 | Dados sensiveis sobre identidade, orientacao, pertencimento ou vulnerabilidade nao podem ser obrigatorios. |

## Visibilidade de curriculos e perfis

| ID | Regra |
|---|---|
| RN-11 | O candidato controla a visibilidade do proprio curriculo. |
| RN-12 | Por padrao, dados completos do candidato so devem ficar visiveis ao contratante apos candidatura ou consentimento de visibilidade ampliada. |
| RN-13 | Contratantes nao verificados podem ter acesso limitado a dados de candidatos. |
| RN-14 | Informacoes sensiveis nao devem aparecer em listagens publicas. |
| RN-15 | Coordenadores e admins podem acessar dados necessarios para suporte, moderacao e auditoria, respeitando minimizacao. |

## Vagas

| ID | Regra |
|---|---|
| RN-16 | Apenas contratantes com conta ativa e e-mail confirmado podem criar vagas. |
| RN-17 | Vaga nova deve iniciar como `pendente` quando a moderacao previa estiver ativa. |
| RN-18 | Vagas aprovadas podem receber candidaturas. |
| RN-19 | Vagas pausadas, encerradas ou rejeitadas nao podem receber novas candidaturas. |
| RN-20 | Vagas devem respeitar diretrizes de diversidade, inclusao e nao discriminacao. |
| RN-21 | Vagas com linguagem discriminatoria, abusiva, ilegal ou inadequada devem ser rejeitadas ou encaminhadas para revisao. |
| RN-22 | O contratante deve informar faixa salarial ou justificar sua ausencia, conforme politica da plataforma. |
| RN-23 | Contratantes novos podem ter limite inicial de vagas ativas. Sugestao para MVP: ate 3 vagas ativas. |

## Candidaturas

| ID | Regra |
|---|---|
| RN-24 | Um candidato nao pode se candidatar duas vezes a mesma vaga. |
| RN-25 | A candidatura deve registrar data, vaga, candidato, status e curriculo utilizado. |
| RN-26 | Status de candidatura deve seguir fluxo controlado. Sugestao: `enviada`, `em_analise`, `selecionada`, `recusada`, `cancelada`. |
| RN-27 | Toda alteracao de status deve registrar autor, data, status anterior e novo status. |
| RN-28 | O candidato pode cancelar candidatura enquanto a vaga estiver ativa. |

## Moderacao e denuncias

| ID | Regra |
|---|---|
| RN-29 | Qualquer usuario autenticado pode denunciar vaga, perfil ou comportamento inadequado. |
| RN-30 | Denuncia deve ter tipo, descricao, entidade denunciada, autor opcionalmente identificavel para equipe interna e status. |
| RN-31 | Coordenadores devem registrar motivo ao aprovar, rejeitar, pausar ou suspender conteudo denunciado. |
| RN-32 | Decisoes de moderacao devem ser auditaveis. |
| RN-33 | Conteudos com alto risco podem ser ocultados temporariamente ate revisao. |
| RN-34 | Usuario suspenso nao pode publicar vagas, candidatar-se ou acessar funcionalidades sensiveis. |

## Auditoria e administracao

| ID | Regra |
|---|---|
| RN-35 | Acoes sensiveis devem gerar log de auditoria. |
| RN-36 | Logs de auditoria devem registrar usuario executor, acao, entidade afetada, data e contexto minimo. |
| RN-37 | Auditoria nao deve armazenar senhas, tokens ou dados sensiveis sem necessidade clara. |
| RN-38 | Admin pode desativar usuario, mas exclusao definitiva deve respeitar politica de retencao e LGPD. |
