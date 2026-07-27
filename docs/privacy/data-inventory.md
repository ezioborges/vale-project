# Inventário de tratamento de dados

Status: rascunho técnico — decisões jurídicas, operacionais e de fornecedores pendentes de aprovação.
Última revisão técnica: 2026-07-26. Próxima revisão: antes de qualquer ativação de exportação,
consentimento opcional ou exclusão de dados reais.

Este inventário é uma linha de base verificável do schema, storage e configuração atuais. A base
legal, o prazo legal e o destino definitivo não foram inferidos: onde ainda não há aprovação, o
valor é `PENDENTE_APROVACAO` e bloqueia automações destrutivas.

| Conjunto | Titular/origem | Finalidade técnica observada | Sistemas e visibilidade | Retenção/destino | Owner e evidência |
| --- | --- | --- | --- | --- | --- |
| `users` (nome, e-mail, hash de senha, estado) | usuário; cadastro | autenticação e operação da conta | PostgreSQL; titular/equipe autorizada | `PENDENTE_APROVACAO`; não automatizar exclusão | Produto + Jurídico; entity `users` e migration de identidade |
| tokens de sessão, reset e verificação | usuário; sistema | sessão, recuperação e verificação | PostgreSQL; nunca expostos após emissão | TTL técnico já configurado; limpeza pós-TTL `PENDENTE_APROVACAO` | Segurança; tabelas de tokens e configuração |
| `term_acceptances` | usuário; cadastro | provar aceite de documentos obrigatórios | PostgreSQL; titular/equipe autorizada | `PENDENTE_APROVACAO`; não é consentimento opcional | Jurídico; `terms.service.ts` |
| perfil de candidato | candidato; próprio titular | apresentação e candidatura | PostgreSQL e API conforme visibilidade | `PENDENTE_APROVACAO` | Produto; `candidate_profiles`, campos JSON/texto livre |
| perfil de contratante | responsável/empresa; próprio titular | publicação e gestão de vagas | PostgreSQL e API autorizada | `PENDENTE_APROVACAO` | Produto + Jurídico; `employer_profiles` |
| assets de perfil e currículo | usuário; upload | avatar/logo e currículo para fluxos autorizados | storage privado, metadados PostgreSQL | currículo de candidatura segue retenção técnica existente; política legal `PENDENTE_APROVACAO` | Segurança; `profile_assets`, snapshots e lifecycle |
| vagas e candidaturas | contratante/candidato e possíveis terceiros | intermediação de oportunidades | PostgreSQL, storage de snapshot e destinatário autorizado | snapshots têm job técnico existente; destino definitivo `PENDENTE_APROVACAO` | Produto + Jurídico; entities/jobs |
| denúncias e decisões | denunciante, alvo e equipe | moderação, segurança e evidência | PostgreSQL; equipe autorizada | `PENDENTE_APROVACAO`; possível exceção de defesa de direitos | Segurança + Jurídico; reports/moderation |
| auditoria, rate limit e logs | usuário, visitante e sistema | segurança, investigação e operação | PostgreSQL, saída de logs e métricas | `PENDENTE_APROVACAO`; logs devem ser redigidos | Segurança; audit/rate-limit/observabilidade |
| outbox e idempotência | usuário; sistema | entrega confiável e retry seguro | PostgreSQL; payload de outbox cifrado | janela operacional e TTL `PENDENTE_APROVACAO` | Engenharia + Segurança; migrations da etapa 4 |
| backups e restaurações | todos os titulares contidos na cópia | continuidade e recuperação | provedor aprovado, acesso mínimo | RPO/RTO, região e expiração `PENDENTE_APROVACAO` | Operações; runbook de restore |

Campos JSON, texto livre, nomes de arquivos e descrições são classificados como potencialmente
pessoais ou sensíveis, independentemente do nome da coluna. Novos campos, provedores, logs ou
artefatos de storage não podem entrar em produção sem acrescentar uma linha ou atualizar a existente.
