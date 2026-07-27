# Runbook — exclusão e anonimização de conta

Status: somente desenho; executor bloqueado até D-03, D-05, D-06, D-08 e D-12.

1. Confirmar protocolo, identidade, período de segurança e possibilidade de cancelamento aprovados.
2. Executar dry-run e registrar cada dado como `delete`, `anonymize`, `retain`, `manual_review` ou
   `not_found`, com regra versionada.
3. Revogar sessões antes do passo irreversível e restringir a conta ao estado definido.
4. Processar storage e banco como saga idempotente; `NotFound` no storage é sucesso idempotente.
5. Só concluir após persistir ledger mínimo de eliminação e validar os passos obrigatórios.
6. Em restore, manter o ambiente isolado, reaplicar ledger/revogações antes do tráfego e destruir o
   ambiente de ensaio.

Uma retenção parcial exige motivo aprovado. Backup não é usado para desfazer exclusão concluída.
