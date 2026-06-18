# Modelo de Dados Inicial

Este documento descreve um modelo conceitual inicial. Os nomes podem ser refinados durante a implementacao com TypeORM.

## Entidades principais

| Entidade | Descricao |
|---|---|
| User | Conta base de autenticacao e autorizacao. |
| CandidateProfile | Perfil profissional do candidato. |
| EmployerProfile | Perfil do contratante, empresa ou pessoa fisica. |
| Job | Vaga publicada por contratante. |
| Application | Candidatura de um candidato a uma vaga. |
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
| resumeFileUrl | varchar nullable | Arquivo de curriculo. |
| visibility | enum | `private`, `applications_only`, `verified_employers`. |
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
| document | varchar nullable | Avaliar necessidade e LGPD. |
| segment | varchar nullable | Area de atuacao. |
| description | text nullable | Descricao institucional. |
| website | varchar nullable | Site ou rede profissional. |
| location | varchar nullable | Localidade. |
| isVerified | boolean | Validacao administrativa futura. |
| createdAt | timestamp | Criacao. |
| updatedAt | timestamp | Atualizacao. |

## Job

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| employerProfileId | uuid | Dono da vaga. |
| title | varchar | Titulo. |
| description | text | Descricao completa. |
| requirements | text nullable | Requisitos. |
| benefits | text nullable | Beneficios. |
| location | varchar nullable | Localidade. |
| workMode | enum | `remote`, `hybrid`, `onsite`. |
| contractType | enum | CLT, PJ, estagio, temporario ou outros. |
| seniority | enum nullable | Junior, pleno, senior ou outros. |
| salaryMin | numeric nullable | Faixa salarial minima. |
| salaryMax | numeric nullable | Faixa salarial maxima. |
| salaryHiddenReason | text nullable | Justificativa se salario nao for informado. |
| accessibilityInfo | text nullable | Acessibilidade e adaptacoes. |
| inclusionCommitment | boolean | Aceite de diretriz inclusiva da vaga. |
| status | enum | `draft`, `pending_review`, `approved`, `rejected`, `paused`, `closed`, `reported`. |
| rejectionReason | text nullable | Motivo de rejeicao. |
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
| resumeSnapshotUrl | varchar nullable | Curriculo utilizado na candidatura. |
| submittedAt | timestamp | Data da candidatura. |
| updatedAt | timestamp | Atualizacao. |

## Report

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| reporterUserId | uuid | Autor da denuncia. |
| targetType | enum | `job`, `profile`, `user`, `application`. |
| targetId | uuid | Entidade denunciada. |
| reason | enum | Tipo da denuncia. |
| description | text | Detalhes. |
| status | enum | `open`, `in_review`, `resolved`, `dismissed`. |
| createdAt | timestamp | Criacao. |
| updatedAt | timestamp | Atualizacao. |

## AuditLog

| Campo | Tipo sugerido | Observacao |
|---|---|---|
| id | uuid | Chave primaria. |
| actorUserId | uuid nullable | Usuario executor, quando existir. |
| action | varchar | Acao executada. |
| entityType | varchar | Tipo de entidade afetada. |
| entityId | uuid nullable | ID da entidade. |
| metadata | jsonb | Contexto minimo sem segredos. |
| createdAt | timestamp | Data do evento. |

## Relacionamentos iniciais

| Relacionamento | Cardinalidade |
|---|---|
| User -> CandidateProfile | 1:0..1 |
| User -> EmployerProfile | 1:0..1 |
| EmployerProfile -> Job | 1:N |
| Job -> Application | 1:N |
| CandidateProfile -> Application | 1:N |
| User -> Report | 1:N |
| User -> AuditLog | 1:N |

## Indices recomendados

| Tabela | Campos |
|---|---|
| users | email, role, status |
| candidate_profiles | userId, visibility |
| employer_profiles | userId, isVerified |
| jobs | employerProfileId, status, workMode, contractType, seniority, publishedAt |
| applications | jobId, candidateProfileId, status |
| reports | status, targetType, targetId |
| audit_logs | actorUserId, action, entityType, createdAt |
