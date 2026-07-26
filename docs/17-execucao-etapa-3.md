# Execução da etapa 3 — abuso, uploads e retenção

## Cenários tratados

- tentativas distribuídas de autenticação e abuso concentrado contra um mesmo e-mail;
- rotação de refresh usada para escapar de um limite por token individual;
- spam de denúncias por usuário e alvo;
- consumo excessivo de upload, download de currículo e busca pública;
- arquivo disfarçado, PDF criptografado ou com conteúdo ativo, imagem malformada ou decompression
  bomb e malware conhecido;
- indisponibilidade ou lentidão do scanner e do storage remoto;
- snapshot vencido preservado por depender apenas do bootstrap, falha parcial de exclusão e corrida
  entre réplicas.

## Políticas de rate limit

Cada bucket persiste somente uma chave SHA-256; e-mail, token, IP, usuário e alvo não são gravados em
texto. As respostas bloqueadas usam `429`, mensagem genérica e `Retry-After`. Os limites são
janelas finitas: não existe bloqueio permanente da conta-alvo.

| Fluxo | Identidades e limites |
| --- | --- |
| cadastro | 20 por IP/10 min e 5 por e-mail normalizado/hora |
| login | 30 por IP/5 min e 10 por e-mail normalizado/5 min |
| refresh | 60 por IP/min e 30 por família de sessão/min |
| confirmação, reset e reenvio | buckets independentes por IP e token, e-mail ou usuário |
| denúncia | 10 por usuário/hora e 3 por usuário+tipo+alvo/dia |
| upload de perfil | 20 requisições/hora e 25 MiB/hora por usuário e finalidade |
| currículo e arquivo sensível | limite de requisições e orçamento diário em MiB por usuário e finalidade |
| busca pública | 120 requisições por IP/min |

A família do refresh é resolvida pelo hash do cookie opaco e permanece estável após a rotação. A
limpeza de `rate_limit_counters` executa no bootstrap e depois em intervalo configurado; o caminho
da requisição faz somente o incremento atômico do bucket. O índice existente por `expires_at`
continua servindo a manutenção. Logs estruturados registram bloqueios por política/bucket e cada
manutenção informa quantos buckets expiraram e quantos permanecem ativos, sem incluir a identidade.

## Pipeline de arquivos

O upload segue esta sequência síncrona e fail-closed:

1. grava o corpo sob o prefixo privado `quarantine/`;
2. aplica limite por finalidade, extensão coerente, MIME e assinatura;
3. exige PDF com estrutura mínima e EOF, recusa `/Encrypt` e ações como JavaScript, launch,
   embedded file e rich media;
4. envia o conteúdo bruto ao ClamAV por `INSTREAM`;
5. decodifica imagens com limite de 20 megapixels, aplica rotação segura, limita dimensões e
   reencoda no formato aceito, removendo metadados não necessários;
6. grava o resultado sob `approved/` e remove a quarentena;
7. somente então troca a referência transacional do perfil; falha no banco remove o novo objeto.

Arquivo reprovado ou scanner indisponível nunca recebe registro em `profile_assets` nem chave
aprovada. A quarentena é removida inclusive no caminho de erro. Falha de scan gera auditoria apenas
com usuário, finalidade e motivo controlado; conteúdo, nome do malware e bytes não são copiados.
Download de currículo de perfil e de candidatura é autorizado, limitado por volume e auditado.

Em produção, `FILE_SCAN_DRIVER=clamav` e `CLAMAV_HOST` são obrigatórios. `disabled` existe apenas
para desenvolvimento e testes com dados fictícios. O adapter S3:

- envia `x-amz-server-side-encryption: AES256` em todo `PUT`;
- aplica timeout, até duas novas tentativas com backoff para falha transitória e circuit breaker;
- não cria URL pública nem envia ACL pública;
- usa a mesma interface idempotente de exclusão do adapter local.

Bloqueio público do bucket, atualização das assinaturas do ClamAV, credencial mínima e lifecycle são
controles da infraestrutura e permanecem obrigatórios no runbook. A credencial de runtime não deve
ter permissão para alterar política, ACL ou lifecycle do bucket.

## Retenção recorrente

`ApplicationRetentionService` agora executa no bootstrap e ao menos diariamente. Um lock consultivo
do PostgreSQL permite um executor por vez entre réplicas, e os lotes usam `FOR UPDATE SKIP LOCKED`.
Cada ciclo:

- conta elegíveis antes de começar;
- processa lotes até esgotar a fila ou atingir o teto configurado;
- remove primeiro o objeto e depois a linha, tornando o retry idempotente;
- tenta cada item no máximo uma vez por ciclo, sem deixar uma falha antiga bloquear o restante;
- registra vencidos, removidos, falhos, duração, fila remanescente e idade do vencido mais antigo;
- emite aviso quando a idade excede o SLA operacional.

A migration `1710000006000-HardenAbuseUploadsRetention` adiciona o índice por
`retention_until, id`. Os testes cobrem candidatura cancelada, candidatura rejeitada e candidatura
ainda submetida cuja vaga foi encerrada, além de um executor concorrente que não adquire o lock.

## Configuração e operação

| Variável | Padrão | Regra |
| --- | --- | --- |
| `RATE_LIMIT_CLEANUP_INTERVAL_SECONDS` | 300 | manutenção periódica dos buckets |
| `FILE_SCAN_DRIVER` | `disabled` | obrigatoriamente `clamav` em produção |
| `CLAMAV_HOST` / `CLAMAV_PORT` | sem host / 3310 | endpoint privado do daemon |
| `CLAMAV_TIMEOUT_MILLISECONDS` | 5000 | upload falha fechado ao expirar |
| `S3_TIMEOUT_MILLISECONDS` / `S3_MAX_RETRIES` | 5000 / 2 | orçamento de chamada ao storage |
| `S3_CIRCUIT_FAILURE_THRESHOLD` / `S3_CIRCUIT_RESET_SECONDS` | 5 / 30 | abertura e recuperação do circuito |
| `RETENTION_JOB_INTERVAL_SECONDS` | 86400 | schema recusa intervalo maior que um dia |
| `RETENTION_JOB_BATCH_SIZE` | 100 | linhas bloqueadas por lote |
| `RETENTION_JOB_MAX_ITEMS_PER_CYCLE` | 1000 | teto de trabalho por ciclo |
| `RETENTION_ALERT_AGE_SECONDS` | 86400 | SLA inicial para aviso |

Rollout: aplicar a migration, preparar bucket e ClamAV, validar um arquivo EICAR em staging sem
persisti-lo, confirmar uma imagem/PDF limpos, observar `429`, métricas de retenção e circuit breaker,
e só então promover. O proxy deve limitar o corpo de `/api/profiles/files` a no máximo 6 MiB.

Rollback: preservar a migration e os prefixos de storage; restaurar o artefato anterior se o scanner
ou o storage causarem indisponibilidade. Produção não permite desligar o scanner como atalho. Objetos
em `quarantine/` sem referência podem ser removidos pela regra de lifecycle após a janela operacional
definida; objetos `approved/` seguem a política de retenção do dado a que pertencem.

## Evidência automatizada

Os testes cobrem:

- composição e normalização dos buckets, família de refresh e incremento atômico sem limpeza por
  requisição;
- `429` previsível para login e denúncia, com retry;
- promoção de PDF limpo, rejeição de PDF criptografado/ativo e remoção da quarentena;
- malware e indisponibilidade do scanner sem conteúdo em auditoria;
- decodificação e reencodificação de imagem com limite de pixels;
- criptografia, retry transitório e abertura do circuit breaker no adapter S3;
- migration forward/revert, lock entre réplicas, métricas, idempotência e estados elegíveis da
  retenção.

O gate de conclusão é `pnpm validate`, seguido por `pnpm audit:prod` e `git diff --check`.

## Resultado verificado em 2026-07-26

- `pnpm validate`: passou em formatação, lint, typecheck, 90 testes
  unitários/frontend/shared, 23 testes de integração com PostgreSQL e builds de shared, API e Web;
- `pnpm audit:prod`: política passou sem alerta crítico/alto bloqueante; permanece a exceção
  temporária válida de `brace-expansion` já documentada na etapa 0;
- `git diff --check`: passou sem erro de whitespace.
