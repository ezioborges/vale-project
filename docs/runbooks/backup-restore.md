# Runbook — backup e restauração

Status: mecanismo, RPO, RTO, região e retenção `PENDENTE_APROVACAO` (D-08).

Todo ensaio usa ambiente isolado, sem e-mail de saída nem tráfego público. Registrar backup, horário,
commit/migrations, credenciais temporárias, RPO/RTO medidos e resultado. Após restaurar: aplicar
migrations, reaplicar ledger de eliminações/revogações posterior ao backup, validar queries e fluxos
sintéticos, destruir ambiente e credenciais. Dados restaurados não servem para desenvolvimento.

