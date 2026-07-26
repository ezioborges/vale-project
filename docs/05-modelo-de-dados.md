# Modelo de Dados Inicial

Este documento descreve um modelo conceitual inicial. Os nomes podem ser refinados durante a implementacao com TypeORM.

## Entidades principais

| Entidade | Descricao |
|---|---|
| User | Conta base de autenticacao e autorizacao. |
| CandidateProfile | Perfil profissional do candidato. |
| EmployerProfile | Perfil do contratante, empresa ou pessoa fisica. |
| ProfileAsset | Metadados do avatar, logo ou currículo armazenado de forma privada. |
| Job | Vaga publicada por contratante. |
| Application | Candidatura de um candidato a uma vaga. |
| ApplicationStatusHistory | Histórico imutável das transições da candidatura. |
| ApplicationResumeSnapshot | Cópia privada do currículo usada na candidatura. |
| Report | Denuncia feita por usuario autenticado. |
| ModerationDecision | Decisao tomada por coordenador ou admin. |
| TermsAcceptance | Registro de aceite de termos. |
| AuditLog | Registro de acoes sensiveis. |

## User

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| email | varchar | Unico para contas ativas. |
| passwordHash | varchar | Nunca armazenar senha em texto puro. |
| role | enum | `admin`, `coordinator`, `employer`, `candidate`. |
| status | enum | `pending_email`, `active`, `suspended`, `disabled`. |
| emailVerifiedAt | timestamp nullable | Confirmacao de e-mail. |
| createdAt | timestamp | Criacao. |
| updatedAt | timestamp | Atualizacao. |
| deletedAt | timestamp nullable | Soft delete quando aplicavel. |

## CandidateProfile

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| userId | uuid | Relacao 1:1 com User. |
| displayName | varchar | Pode ser nome social. |
| pronouns | varchar nullable | Opcional. |
| headline | varchar nullable | Titulo profissional. |
| bio | text nullable | Resumo profissional. |
| location | varchar nullable | Cidade/estado ou remoto. |
| workPreferences | jsonb | Modalidade, regime, areas e disponibilidade. |
| skills | jsonb | Lista inicial simples para MVP. |
| experiences | jsonb | Experiencias estruturadas. |
| education | jsonb | Formacao estruturada. |
| professionalLinks | jsonb | Links profissionais validados. |
| visibility | enum | `private`, `applications_only`, `verified_employers`. |
| isActive | boolean | Permite desativar a exposição sem apagar a trajetória. |
| createdAt | timestamp | Criacao. |
| updatedAt | timestamp | Atualizacao. |

## EmployerProfile

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| userId | uuid | Relacao 1:1 com User. |
| type | enum | `company`, `organization`, `individual`. |
| organizationName | varchar nullable | Obrigatorio para empresa/organizacao. |
| responsibleName | varchar | Pessoa responsavel. |
| contactEmail | varchar | Contato profissional do responsável. |
| contactPhone | varchar nullable | Contato opcional. |
| segment | varchar nullable | Area de atuacao. |
| description | text nullable | Descricao institucional. |
| website | varchar nullable | Site ou rede profissional. |
| location | varchar nullable | Localidade. |
| isVerified | boolean | Validacao administrativa futura. |
| createdAt | timestamp | Criacao. |
| updatedAt | timestamp | Atualizacao. |

## ProfileAsset

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| userId | uuid | Titular do arquivo. |
| kind | enum | `avatar`, `logo` ou `resume`. |
| originalName | varchar | Nome normalizado apenas para apresentação/download. |
| mimeType | varchar | Tipo confirmado por MIME e assinatura do conteúdo. |
| sizeBytes | integer | Tamanho validado conforme a finalidade. |
| storageKey | text | Chave aleatória privada; nunca é URL pública. |
| createdAt | timestamp | Primeiro envio. |
| updatedAt | timestamp | Substituição da versão corrente. |

## Job

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| employerProfileId | uuid | Perfil institucional dono da vaga. |
| ownerUserId | uuid | Conta dona, materializada para autorização e auditoria. |
| title | varchar | Titulo. |
| area | varchar | Área exibida ao público. |
| areaNormalized | varchar | Valor normalizado para filtro. |
| description | text | Descricao completa. |
| responsibilities | text nullable | Responsabilidades. |
| requirements | text nullable | Requisitos. |
| benefits | text nullable | Beneficios. |
| location | varchar | Localidade. |
| workMode | enum | `remote`, `hybrid`, `onsite`. |
| contractType | enum | CLT, PJ, estagio, temporario ou outros. |
| seniority | enum | Estágio, júnior, pleno, sênior, liderança, especialista ou não aplicável. |
| salaryMin | numeric nullable | Faixa salarial minima. |
| salaryMax | numeric nullable | Faixa salarial maxima. |
| salaryHiddenReason | text nullable | Justificativa se salario nao for informado. |
| accessibilityInfo | text nullable | Acessibilidade e adaptacoes. |
| inclusionCommitment | boolean | Aceite de diretriz inclusiva da vaga. |
| status | enum | `draft`, `pending_review`, `changes_requested`, `approved`, `rejected`, `paused`, `closed`, `reported`. |
| moderationReason | text nullable | Motivo de ajuste/rejeição mantido no recurso, não no log. |
| moderatedByUserId | uuid nullable | Autor da última decisão. |
| moderatedAt | timestamp nullable | Data da última decisão. |
| publishedAt | timestamp nullable | Publicacao. |
| closedAt | timestamp nullable | Encerramento. |
| createdAt | timestamp | Criacao. |
| updatedAt | timestamp | Atualizacao. |

## Application

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| jobId | uuid | Vaga. |
| candidateProfileId | uuid | Candidato. |
| status | enum | `submitted`, `under_review`, `shortlisted`, `rejected`, `cancelled`. |
| coverMessage | text nullable | Mensagem opcional. |
| submittedAt | timestamp | Data da candidatura. |
| updatedAt | timestamp | Atualizacao. |

Existe uma constraint única por `(jobId, candidateProfileId)`.

## ApplicationStatusHistory

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primária. |
| applicationId | uuid | Candidatura. |
| actorUserId | uuid | Pessoa que executou a transição. |
| fromStatus | enum nullable | Nulo somente na criação. |
| toStatus | enum | Novo estado. |
| changedAt | timestamp | Data da transição. |

## ApplicationResumeSnapshot

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primária. |
| applicationId | uuid | Relação 1:1 com candidatura. |
| originalName | varchar | Nome normalizado para download. |
| mimeType | varchar | Somente `application/pdf`. |
| sizeBytes | integer | Tamanho validado. |
| storageKey | text | Chave privada única, nunca uma URL pública. |
| retentionUntil | timestamp | Prazo mínimo antes da limpeza de processo terminado. |
| createdAt | timestamp | Criação do snapshot. |

## Report

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| reporterUserId | uuid | Autor da denuncia. |
| targetUserId | uuid | Titular afetado, materializado para autorização e auditoria. |
| targetType | enum | `job`, `profile`, `user`, `application`. |
| targetId | uuid | Entidade denunciada. |
| reason | enum | Discriminação, assédio, fraude, conteúdo, privacidade, spam ou outro. |
| description | text | Relato de 20 a 2.000 caracteres, restrito à equipe. |
| status | enum | `open`, `in_review`, `resolved`, `dismissed`. |
| priority | enum | `low`, `normal`, `high`, `urgent`. |
| reviewedAt | timestamp nullable | Data da decisão final. |
| createdAt | timestamp | Criacao. |
| updatedAt | timestamp | Atualizacao. |

Existe um índice parcial único por `(reporterUserId, targetType, targetId)` enquanto a denúncia
estiver `open` ou `in_review`.

## ModerationDecision

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primária. |
| reportId | uuid | Denúncia analisada. |
| actorUserId | uuid | Coordenador/admin responsável. |
| action | enum | `start_review`, `resolve`, `dismiss`, `hide_job`, `restore_job`. |
| reason | text | Motivo interno de 10 a 1.000 caracteres. |
| fromStatus | enum | Estado anterior da denúncia. |
| toStatus | enum | Estado resultante. |
| createdAt | timestamp | Data da decisão. |

## AuditLog

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| actorUserId | uuid | Usuario executor. |
| targetUserId | uuid | Titular afetado pela ação. |
| action | varchar | Acao executada. |
| context | jsonb | Allowlist de IDs, estados e nomes de campos sem conteúdo sensível. |
| ipAddress | inet nullable | Contexto de segurança, omitido na API consultável. |
| userAgent | text nullable | Contexto de segurança, omitido na API consultável. |
| createdAt | timestamp | Data do evento. |

## Relacionamentos iniciais

| Relacionamento | Cardinalidade |
|---|---|
| User -> CandidateProfile | 1:0..1 |
| User -> EmployerProfile | 1:0..1 |
| User -> ProfileAsset | 1:0..N, limitado a uma versão por finalidade |
| EmployerProfile -> Job | 1:N |
| Job -> Application | 1:N |
| CandidateProfile -> Application | 1:N |
| Application -> ApplicationStatusHistory | 1:N |
| Application -> ApplicationResumeSnapshot | 1:0..1 |
| User -> Report | 1:N como autor e como titular afetado |
| Report -> ModerationDecision | 1:N |
| User -> AuditLog | 1:N |

## Indices recomendados

| Tabela | Campos |
|---|---|
| users | email, role, status |
| candidate_profiles | userId, visibility |
| employer_profiles | userId, isVerified |
| profile_assets | userId, `(userId, kind)` único, storageKey único |
| jobs | employerProfileId, status, workMode, contractType, seniority, publishedAt |
| applications | `(jobId, candidateProfileId)` único, candidateProfileId + data, jobId + status |
| application_status_history | applicationId + data + id |
| application_resume_snapshots | applicationId único, storageKey único |
| reports | status + priority + data, reporterUserId + data, targetType + targetId, unicidade ativa parcial |
| moderation_decisions | reportId + data + id |
| audit_events | actorUserId, targetUserId, action, createdAt |
