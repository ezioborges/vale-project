# Execução inicial da etapa 4 — LGPD, consistência e operação

- Plano executado: [18-plano-execucao-etapa-4.md](planos-de-acao/etapas/18-plano-execucao-etapa-4.md)
- Data da verificação: 2026-07-26
- Estado: implementação técnica inicial concluída; ativações de tratamento dependem de aprovação

## Resultado

Foram entregues os controles técnicos reversíveis da etapa: cadastro atômico com outbox, idempotência
nas criações sujeitas a repetição, observabilidade local, endurecimento de transporte e documentação
operacional. O Centro de privacidade expõe somente um resumo autenticado e não inicia exportação,
exclusão, consentimento opcional ou eliminação automatizada.

As decisões jurídicas e operacionais ainda não aprovadas permanecem explícitas como
`PENDENTE_APROVACAO`. Por isso, a etapa não deve ser considerada pronta para operar pedidos LGPD
reais nem para excluir dados de produção.

## Entregas verificadas

| Frente | Implementação |
| --- | --- |
| Governança de dados | Inventário, retenção, direitos, operadores e schema de exportação foram documentados sem inventar base legal, prazo ou destino final. |
| Cadastro confiável | Usuário, aceites, token de verificação, sessão, auditoria e mensagem de verificação são gravados na mesma transação; o provedor de e-mail é chamado somente após o commit. |
| Outbox | Mensagens de e-mail são cifradas em repouso, têm chave de deduplicação, reserva com lease, retentativas com backoff e estado terminal para falhas. |
| Idempotência | Criação de vaga e candidatura aceita `Idempotency-Key`, protege contra payload divergente e responde replay sem repetir os efeitos de banco ou storage. |
| Observabilidade | A API produz logs JSON com redaction, propaga `X-Request-ID`, mede requisições com rota normalizada e disponibiliza métricas internas a administradores. |
| Transporte | Produção exige TLS verificado para PostgreSQL e HTTPS para dependências remotas; o Compose publica PostgreSQL somente em loopback. |
| Privacidade segura | Há rota e tela autenticadas de resumo, sem exportar dados, sem gerar artefatos e sem executar exclusão. |
| Operação | Runbooks de outbox, pedido do titular, exclusão, backup/restauração e incidente foram atualizados ou criados. |

## Limites deliberados

As seguintes capacidades continuam desativadas até haver decisões versionadas do controlador,
encarregado e operação:

- exportação de dados e artefatos baixáveis;
- fluxo assistido e validação de representante;
- consentimentos opcionais e sua revogação;
- agendamento, exclusão, anonimização ou limpeza por retenção;
- escolha e operação de backups, telemetria remota e seus fornecedores;
- comunicação externa de incidente ou à ANPD.

Os gates D-01 a D-12 do plano permanecem `PENDENTE_APROVACAO`. A validade de 24 horas usada para
registros de idempotência é um limite técnico de proteção contra repetição; não é política de
retenção jurídica e deve ser confirmado no gate D-12 antes de qualquer job de limpeza.

## Evidências de validação

Os seguintes comandos foram executados com sucesso durante esta entrega:

```bash
corepack pnpm --filter @vale/shared build
corepack pnpm --filter @vale/api typecheck
corepack pnpm --filter @vale/api lint
corepack pnpm --filter @vale/web typecheck
corepack pnpm format:check
corepack pnpm test
corepack pnpm test:integration
corepack pnpm build
git diff --check
corepack pnpm audit:prod
```

As suítes unitárias passaram (70 testes da API, 15 do web e 6 do pacote compartilhado). As quatro
suítes de integração também passaram, com 23 testes após aplicar as migrations em schema PostgreSQL
isolado. A auditoria de produção não encontrou vulnerabilidade alta ou crítica bloqueante; o alerta
transitivo de `brace-expansion` permanece como exceção aceita já controlada pela etapa 0.

## Próxima autorização necessária

Antes de ativar qualquer operação destrutiva ou expor exportação, registrar para cada gate D-01 a
D-12: responsável, data de aprovação, próxima revisão e evidência da decisão. Com isso aprovado, a
próxima mudança deve implementar cada fluxo por contrato de domínio, testes de falha e rollout
controlado, sem alterar silenciosamente os dados já existentes.
