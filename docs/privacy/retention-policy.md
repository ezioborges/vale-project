# Matriz de retenção e destino final

Esta é uma matriz de controle, não uma decisão jurídica. Onde não houver aprovação, a aplicação
não deve apagar, anonimizar nem prometer eliminação em prazo determinado.

| Conjunto | Gatilho | Prazo | Destino | Exceção/evidência | Estado |
| --- | --- | --- | --- | --- | --- |
| conta e perfil | encerramento/pedido | `PENDENTE_APROVACAO` | excluir/anonimizar por plano versionado | obrigação legal, defesa ou fraude | bloqueia exclusão |
| tokens transitórios | consumo/expiração | TTL técnico existente | limpeza segura | investigação aprovada | revisão pendente |
| aceites e auditoria | término da relação | `PENDENTE_APROVACAO` | preservar mínimo ou anonimizar | prova, segurança e defesa | bloqueia job |
| currículos/snapshots | fim da vaga/candidatura | `PENDENTE_APROVACAO` | excluir objeto e metadata | retenção aprovada por processo | bloqueia alteração do prazo |
| denúncias/decisões | encerramento da moderação | `PENDENTE_APROVACAO` | restringir/anonimizar | evidência de segurança | bloqueia eliminação |
| outbox e exportação | envio/download/expiração | `PENDENTE_APROVACAO` | apagar payload/artefato | protocolo e hash mínimos | bloqueia limpeza automática |
| idempotência | expiração da chave | `PENDENTE_APROVACAO` | apagar registro mínimo | execução ativa | bloqueia limpeza automática |
| logs/métricas/backups | geração/backup | `PENDENTE_APROVACAO` | expirar conforme provedor | incidente/restauração | bloqueia produção |

Uma mudança nesta matriz deve ter versão, aprovador, data, testes de dry-run e evidência de que o
job executou a regra aprovada. Backups não são modificados; após restauração, aplica-se o ledger de
eliminações antes de liberar acesso.
