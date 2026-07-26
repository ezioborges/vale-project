# Decisões de governança — etapa 4

Atualizado em 2026-07-26. Este registro é a fonte de verdade para os gates da etapa 4. Um valor
`PENDENTE_APROVACAO` não é uma autorização implícita: bloqueia a ativação do fluxo correspondente
em produção.

| ID | Decisão | Estado | Responsável necessário | Próxima revisão | Bloqueio técnico |
| --- | --- | --- | --- | --- | --- |
| D-01 | Controlador, operadores, suboperadores e encarregado/canal | `PENDENTE_APROVACAO` | controlador e jurídico | antes de dados reais | canal assistido e incidentes |
| D-02 | Finalidade e base legal de cada tratamento | `PENDENTE_APROVACAO` | jurídico e produto | antes de exportação | exportação e exclusão |
| D-03 | Retenção, gatilho, exceções e destino final | `PENDENTE_APROVACAO` | jurídico, segurança e operação | antes de scheduler destrutivo | eliminação/anonimização |
| D-04 | Validação de titular e representante | `PENDENTE_APROVACAO` | segurança e jurídico | antes do canal assistido | atendimento assistido |
| D-05 | Período de segurança, estado da conta e cancelamento | `PENDENTE_APROVACAO` | produto, jurídico e segurança | antes de exclusão | exclusão de conta |
| D-06 | Conteúdo/redação da cópia completa | `PENDENTE_APROVACAO` | jurídico, segurança e produto | antes de liberar download | exportação pública |
| D-07 | Finalidades opcionais e efeito da revogação | `PENDENTE_APROVACAO` | produto e jurídico | antes de toggles | consentimentos |
| D-08 | RPO, RTO, região, retenção e criptografia de backup | `PENDENTE_APROVACAO` | operação e segurança | antes de produção | backup/restore |
| D-09 | Provedor, acesso e retenção de logs/métricas/alertas | `PENDENTE_APROVACAO` | segurança e operação | antes de telemetria remota | observabilidade remota |
| D-10 | Contratos de e-mail, storage, hospedagem e monitoramento | `PENDENTE_APROVACAO` | jurídico, compras e segurança | antes de produção | dados reais em provedores |
| D-11 | Papéis e escalação para incidentes | `PENDENTE_APROVACAO` | operação e controlador | antes do on-call | runbook de incidente |
| D-12 | TTL de chaves de idempotência e artefatos | `PENDENTE_APROVACAO` | produto, jurídico e segurança | antes de jobs de limpeza | limpeza automática |

## Regras de implementação

- Flags de exportação e exclusão permanecem desligadas até D-02, D-03, D-05 e D-06.
- Jobs que removem dados pessoais ou artefatos não recebem prazo jurídico padrão; exigem uma
  decisão aprovada e versionada.
- Limites técnicos reversíveis (lease, lote e tentativa) podem ter configuração conservadora,
  mas não substituem retenção legal.
- A pessoa que aprovar deve registrar nome/função, data, evidência e a próxima revisão nesta
  tabela; uma aprovação por mensagem não basta.
