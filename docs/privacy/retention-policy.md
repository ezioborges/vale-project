# Matriz de retenção e destino final

Status: bloqueada para automação destrutiva. Este documento registra a decisão que ainda precisa
ser tomada; não fixa prazos jurídicos por suposição.

| Conjunto | Gatilho | Prazo | Destino | Exceção | Owner | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| conta e perfil | exclusão, encerramento ou inatividade | `PENDENTE_APROVACAO` | excluir/anonimizar conforme plano versionado | obrigação legal, defesa de direitos ou fraude documentada | Jurídico + Produto | bloqueia executor de exclusão |
| tokens | expiração, consumo, revogação | TTL técnico configurado; limpeza definitiva `PENDENTE_APROVACAO` | eliminar | investigação de incidente aprovada | Segurança | não ampliar TTL silenciosamente |
| aceites obrigatórios | término da relação | `PENDENTE_APROVACAO` | preservar ou reduzir contexto aprovado | obrigação de prova | Jurídico | não chamar de consentimento |
| snapshots de currículo | estado terminal e prazo técnico atual | configuração atual; política jurídica `PENDENTE_APROVACAO` | eliminar objeto e metadado idempotentemente | litígio/obrigação documentada | Jurídico + Produto | job atual não substitui aprovação |
| denúncias, decisões e auditoria | conclusão do caso | `PENDENTE_APROVACAO` | reduzir, anonimizar ou preservar evidência mínima | segurança/defesa de direitos | Segurança + Jurídico | requer regra por categoria |
| outbox, exportações e idempotência | entrega, expiração ou fim de lease | `PENDENTE_APROVACAO` | apagar payload transitório; preservar resultado mínimo aprovado | incidente em aberto | Engenharia + Segurança | D-12 bloqueia job de limpeza |
| logs, métricas e backups | ingestão/backup concluído | `PENDENTE_APROVACAO` | expirar no provedor; backups nunca são alterados in place | recuperação aprovada | Operações | D-08/D-09 bloqueiam produção |

Toda execução futura deve gerar evidência de dry-run, contagem, regra versionada, ator/sistema,
data e resultado. Uma retenção parcial só é válida com `reason_code` aprovado, jamais com erro
técnico genérico.
