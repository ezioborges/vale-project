# Runbook — exclusão/anonimização de conta

Pré-condições: D-02, D-03 e D-05 aprovadas; plano por domínio versionado; dry-run revisado;
backup/restore e ledger testados.

1. Validar identidade e reautenticação; criar protocolo idempotente e aplicar o estado aprovado.
2. Revogar sessões e aguardar o período de segurança aprovado, permitindo cancelamento somente
   antes do ponto irreversível.
3. Fazer preflight de FKs, storage, pendências e exceções de retenção.
4. Executar a saga por passos persistidos: storage, tabelas, ledger, notificação e conclusão.
5. Tratar `NotFound` no storage como sucesso idempotente; falha deixa `failed_retryable`, nunca
   conclusão falsa.
6. Após restore, manter o ambiente isolado, reaplicar ledger/tombstones e validar antes de liberar.

É proibido restaurar backup para desfazer uma eliminação concluída.
