# Inventário de dados pessoais

Estado: **rascunho técnico, bloqueado para aprovação D-01/D-02/D-03/D-10**. O inventário cobre a
base atual e deve ser reconciliado a cada migration, novo campo JSON, log, métrica, backup ou
provedor. Campos de texto livre podem conter dados pessoais e, eventualmente, sensíveis.

| Conjunto | Titular/origem | Finalidade a aprovar | Sistemas e visibilidade | Retenção/destino | Owner |
| --- | --- | --- | --- | --- | --- |
| `users` | conta; cadastro | identidade, acesso e segurança | PostgreSQL; próprio titular e equipe autorizada | `PENDENTE_APROVACAO`; tombstone após decisão | produto + jurídico |
| tokens de sessão/verificação/reset | conta; sistema | autenticação e recuperação | PostgreSQL; nunca por API | expiração técnica existente; retenção pós-uso pendente | segurança |
| `term_acceptances` | conta; manifestação | provar versão obrigatória | PostgreSQL; equipe autorizada | `PENDENTE_APROVACAO` para IP/user-agent e aceite | jurídico |
| perfis candidato/contratante | titular; perfil | apresentação e matching | PostgreSQL; depende da visibilidade/autorização | `PENDENTE_APROVACAO` | produto |
| `profile_assets` e objetos | titular; upload | avatar, logo e currículo | metadata no PostgreSQL; objeto privado no storage | política de currículo já técnica; prazo jurídico pendente | segurança + produto |
| vagas e candidaturas | contratante/candidato; criação | intermediação e processo seletivo | PostgreSQL; partes autorizadas e equipe | `PENDENTE_APROVACAO`; terceiros devem ser redigidos | produto + jurídico |
| snapshots de currículo | candidato; cópia interna | estabilidade da candidatura | PostgreSQL + storage privado | prazo técnico atual requer aprovação jurídica | produto |
| denúncias e decisões | denunciante, alvo e equipe | segurança, moderação e defesa | PostgreSQL; equipe restrita | `PENDENTE_APROVACAO`; possível exceção de evidência | jurídico + segurança |
| auditoria e rate limit | usuário/visitante; sistema | investigação, integridade e abuso | PostgreSQL; admin restrito | `PENDENTE_APROVACAO` | segurança |
| outbox | conta; sistema | entrega de notificação | PostgreSQL cifrado; provedor de e-mail | payload transitório; janela pendente D-12 | operação |
| idempotência | usuário; cliente | evitar duplicação de mutação | PostgreSQL; nunca exposta | TTL `PENDENTE_APROVACAO` | engenharia |
| pedidos/exportações | titular; solicitação | exercício de direitos | PostgreSQL + storage privado | protocolo/artefato `PENDENTE_APROVACAO` | encarregado |
| logs, métricas e backups | todos; sistemas | operação, segurança e continuidade | provedor ainda não aprovado | `PENDENTE_APROVACAO` | operação + segurança |

## Compartilhamentos e regiões

Os destinatários, suboperadores, regiões, DPA/contratos e controles ainda são
`PENDENTE_APROVACAO` em [processors.md](processors.md). Nenhum conector remoto deve ser ativado
para dados reais antes de D-10.
