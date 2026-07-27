# Runbooks do Vale Project

Este diretório reúne procedimentos operacionais reproduzíveis. Os runbooks descrevem como preparar,
validar e promover o sistema sem depender de conhecimento implícito ou credenciais pessoais.

| Runbook | Uso |
| --- | --- |
| [setup-local.md](setup-local.md) | preparar aplicação e banco do zero |
| [environments.md](environments.md) | separar configuração e promover mudanças entre ambientes |
| [security-checklist.md](security-checklist.md) | revisar mudanças que afetam autenticação, dados ou operação |
| [aplicar-design-system.md](aplicar-design-system.md) | aplicar e validar o padrão visual em uma nova tela |
| [outbox-email.md](outbox-email.md) | operar, investigar e recuperar o envio assíncrono de e-mails |
| [data-subject-request.md](data-subject-request.md) | triar pedido de titular sem ativar operações não aprovadas |
| [account-erasure.md](account-erasure.md) | avaliar exclusão de conta com retenções e aprovações necessárias |
| [backup-restore.md](backup-restore.md) | preparar e comprovar restauração em ambiente isolado |
| [incident-response.md](incident-response.md) | registrar, conter e escalar um incidente de segurança |

Atualize o runbook na mesma mudança que alterar comandos, variáveis, migrations ou responsabilidades
operacionais. Exemplos devem usar apenas dados fictícios.
