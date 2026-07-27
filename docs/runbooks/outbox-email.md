# Runbook — outbox de e-mail

1. Verificar idade do item pendente mais antigo, tentativas, `retry_wait` e itens `dead` sem expor
   destinatário ou token em logs/tickets.
2. Corrigir configuração/conectividade do provedor e confirmar que a chave de cifragem está disponível.
3. Fazer replay por ID administrativo após a causa estar corrigida; nunca editar payload cifrado.
4. Tratar token vencido criando novo token pelo domínio, não reenviando ou prolongando o valor antigo.
5. Confirmar deduplicação do provedor e a métrica de sucesso antes de encerrar o incidente.

