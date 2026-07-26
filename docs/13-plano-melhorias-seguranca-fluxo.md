# Plano de melhorias de segurança, fluxo e operação

## Objetivo

Este plano transforma a revisão do estado atual do Vale Project em uma sequência executável de
melhorias. O foco é preparar o MVP para uma beta pública com menor risco, sem substituir o monólito
modular atual nem ampliar o escopo do produto antes de estabilizar segurança, sessão, privacidade e
operação.

A ordem proposta considera quatro critérios:

1. risco para dados pessoais e contas;
2. impacto direto nos fluxos centrais;
3. dependências entre mudanças;
4. capacidade de verificar cada entrega de forma automatizada.

## Escopo e limites da análise

A revisão de 2026-07-26 cobriu:

- bootstrap, configuração, CORS, Swagger, banco e migrations;
- cadastro, login, cookies, JWT, refresh, recuperação de senha, termos e RBAC;
- perfis, visibilidade, uploads, storage local e S3;
- vagas, candidaturas, snapshots de currículo e retenção;
- denúncias, moderação, administração e auditoria;
- middleware, cliente HTTP e principais componentes do frontend;
- scripts, testes, documentação operacional e dependências instaladas.

Esta foi uma análise estática e local. Ela não substitui pentest, teste de carga, revisão jurídica,
avaliação do ambiente publicado ou inspeção das configurações reais de proxy, banco, bucket, DNS e
provedores.

## Estado verificado

| Verificação | Resultado em 2026-07-26 |
| --- | --- |
| `pnpm format:check` | passou |
| `pnpm lint` | passou |
| `pnpm typecheck` | passou |
| `pnpm test` | passou: 56 testes executados; 21 testes de integração corretamente ignorados nesse comando |
| `pnpm test:integration` | passou: 21 testes com PostgreSQL real |
| `pnpm build` | passou para shared, API e web |
| `pnpm audit --prod` | falhou: 20 alertas, sendo 10 altos, 9 moderados e 1 baixo |
| CI versionada | não encontrada |
| suíte E2E de navegador | não encontrada |

O resultado do audit é uma fotografia do grafo instalado, não uma confirmação de que todas as
vulnerabilidades são alcançáveis no Vale. Mesmo assim, há correções de produção que não devem ser
adiadas, especialmente para Next.js, Multer, Sharp, PostCSS, TypeORM, `js-yaml` e
`brace-expansion`. No momento da revisão, o lockfile resolve Next.js 15.5.19 e TypeORM 0.3.30; os
avisos indicam correções a partir de 15.5.21 e 0.3.31, respectivamente.

## Pontos fortes que devem ser preservados

| Área | Base existente |
| --- | --- |
| Senhas e tokens | Argon2, tokens opacos aleatórios e hashes dos tokens persistidos |
| Sessão | access token curto, rotação de refresh token e detecção de reutilização |
| Autorização | guards globais e verificações de papel, estado e propriedade no backend |
| Validação | DTOs com whitelist e rejeição de campos desconhecidos |
| Banco | migrations versionadas, `synchronize: false`, constraints e locks nos fluxos concorrentes |
| Privacidade | perfil privado por padrão, arquivos fora da árvore pública e currículo preservado por candidatura |
| Produção | configuração recusa defaults locais, provider de e-mail local e storage local |
| Governança | denúncias, moderação, motivos e eventos de auditoria |
| Qualidade | testes unitários e integração real cobrindo as fases 0 a 4 |

As próximas mudanças devem estender essa base, não criar uma segunda arquitetura paralela.

## Resumo executivo dos achados

| ID | Prioridade | Achado | Consequência principal |
| --- | --- | --- | --- |
| SEG-01 | P0 | dependências de produção possuem alertas altos conhecidos | exposição desnecessária a falhas já corrigidas |
| SEG-02 | P0 | autenticação usa cookies, mas não há defesa CSRF explícita nem validação de origem nas mutações | ações autenticadas podem depender apenas do comportamento `SameSite` |
| SEG-03 | P0 | headers de segurança e política de exposição do Swagger não estão configurados | superfície HTTP mais ampla e proteção insuficiente do navegador |
| FLX-01 | P0 | refresh existe na API, mas não é usado de forma central pelo frontend | a sessão prática termina com o access token e gera erros após expiração |
| SEG-04 | P0 | `passwordHash` é selecionado por padrão e respostas de perfil podem incluir metadados do currículo para terceiros autorizados | aumenta o impacto de serialização ou uso acidental |
| SEG-05 | P0 | rate limit usa somente IP e não cobre denúncias ou uploads | abuso distribuído, spam e custo de armazenamento continuam possíveis |
| LGPD-01 | P0 | limpeza de snapshots roda apenas no bootstrap e remove no máximo 100 itens por execução | dados vencidos podem permanecer armazenados indefinidamente |
| OPS-01 | P0 | não há CI versionada nem gate automático de dependências | regressões podem ser integradas sem repetir a evidência local |
| SEG-06 | P1 | upload valida tamanho e assinatura inicial, mas não possui quarentena, antimalware ou processamento seguro | PDFs e imagens hostis continuam chegando ao storage definitivo |
| FLX-02 | P1 | erros e renovação de sessão estão distribuídos entre funções e componentes | mensagens inconsistentes, repetição e recuperação frágil |
| FLX-03 | P1 | cadastro, aceites e criação de tokens não formam uma única operação recuperável | falha intermediária pode deixar conta parcial e bloquear uma nova tentativa |
| LGPD-02 | P1 | não há fluxo implementado de acesso, exportação, exclusão ou anonimização da conta | direitos do titular permanecem apenas documentados |
| OPS-02 | P1 | faltam logs estruturados, correlação, métricas, alertas e política de retenção de auditoria | incidentes e degradações são difíceis de detectar e investigar |
| OPS-03 | P1 | falta definir TLS do banco, backup/restore, topologia Web/API e limites dos provedores | comportamento seguro depende de decisões ainda não registradas |
| QUA-01 | P1 | não há E2E de navegador nem automação de acessibilidade | os fluxos verticais não são comprovados na interface |
| FLX-04 | P2 | formulários longos não têm rascunho recuperável e algumas confirmações usam diálogo nativo | perda de trabalho e experiência inconsistente |
| FLX-05 | P2 | busca e paginação dependem principalmente de estado local | filtros não são facilmente compartilháveis, restauráveis ou indexáveis |

## Evidências principais no código

| Evidência | Observação |
| --- | --- |
| [`apps/api/src/main.ts`](../apps/api/src/main.ts) | Swagger é criado sem condição de ambiente e não há configuração global de headers |
| [`apps/api/src/auth/auth.controller.ts`](../apps/api/src/auth/auth.controller.ts) | access e refresh usam cookies; não existe token CSRF ou validação de origem |
| [`apps/api/src/auth/auth.service.ts`](../apps/api/src/auth/auth.service.ts) | rotação é segura, mas o JWT ainda inclui e-mail e o cadastro atravessa operações separadas |
| [`apps/web/lib/api.ts`](../apps/web/lib/api.ts) | refresh não faz parte de um transporte autenticado central com retry único |
| [`apps/web/middleware.ts`](../apps/web/middleware.ts) | claims são decodificadas para UX sem validação de assinatura ou expiração |
| [`apps/api/src/users/user.entity.ts`](../apps/api/src/users/user.entity.ts) | `passwordHash` não usa `select: false` |
| [`apps/api/src/profiles/profiles.service.ts`](../apps/api/src/profiles/profiles.service.ts) | resposta de candidato é compartilhada entre audiências e inclui os assets do perfil |
| [`apps/api/src/common/rate-limit/rate-limit.guard.ts`](../apps/api/src/common/rate-limit/rate-limit.guard.ts) | a identidade do limitador é apenas o IP |
| [`apps/api/src/reports/reports.controller.ts`](../apps/api/src/reports/reports.controller.ts) | criação de denúncia não possui uma política de rate limit |
| [`apps/api/src/jobs/application-retention.service.ts`](../apps/api/src/jobs/application-retention.service.ts) | purge executa no bootstrap e busca somente os primeiros 100 elegíveis |
| [`apps/web/next.config.ts`](../apps/web/next.config.ts) | build ignora lint e não define headers de segurança |
| [`package.json`](../package.json) | existem scripts locais de qualidade, mas não foi encontrado workflow de CI ou E2E |

### Interpretação das prioridades

| Prioridade | Regra |
| --- | --- |
| P0 | concluir antes de uma beta pública com dados reais |
| P1 | concluir no primeiro ciclo de estabilização da beta |
| P2 | executar depois dos gates de segurança e operação, orientado por uso real |

## Etapa 0 — baseline, CI e triagem de dependências

Objetivo: tornar reproduzível o estado que hoje só foi validado localmente.

Plano executável:
[`14-plano-acao-etapa-0.md`](14-plano-acao-etapa-0.md).

| Entrega | Ação | Critério de aceite |
| --- | --- | --- |
| Pipeline obrigatório | executar install congelado, format check, lint, typecheck, testes, integração e build | a revisão não pode ser integrada quando um gate falha |
| Audit de produção | gerar relatório do grafo de produção em toda mudança de lockfile | vulnerabilidade crítica ou alta bloqueia; exceção exige alcance, mitigação, responsável e validade |
| Renovação de dependências | atualizar primeiro os patches de Next.js e TypeORM e resolver os transitivos de Multer, Sharp, PostCSS, YAML e glob | `pnpm audit --prod` fica sem crítico/alto não aceito e toda a suíte continua verde |
| Evidência | publicar resultados e versão do lockfile como artefato do pipeline | o relatório pode ser relacionado à revisão e ao commit |
| Higiene do repositório | retirar `tsconfig.tsbuildinfo` do versionamento ou impedir que checks o alterem | build e typecheck não deixam o worktree sujo |

Regras de execução:

- atualizar em lotes pequenos, começando por patches compatíveis;
- revisar changelogs e testes de cada pacote direto;
- não usar `audit fix --force` sem entender alterações de versão;
- manter uma exceção temporária somente quando o caminho vulnerável não for alcançável e houver
  compensação verificável.

Marco: o commit promovido foi produzido e validado pelo mesmo pipeline registrado no repositório.

## Etapa 1 — endurecer a fronteira HTTP e a sessão

Objetivo: reduzir a superfície de ataque antes de evoluir funcionalidades.

### Cookies, CSRF e JWT

1. definir uma topologia oficial: Web e API no mesmo site ou uma camada BFF/reverse proxy
   same-origin;
2. proteger `POST`, `PATCH`, `PUT` e `DELETE` autenticados por cookie com token CSRF e validação de
   `Origin`/`Referer`;
3. preservar `HttpOnly`, `Secure` em produção e `SameSite` explícito; revisar nome com prefixo seguro,
   domínio, path e expiração de cada cookie;
4. remover o refresh token do corpo para clientes web; se clientes não web forem necessários, criar
   contrato separado e documentado;
5. adicionar `issuer`, `audience`, algoritmo permitido e identificador de sessão ao JWT;
6. remover o e-mail do payload do access token, pois a API já consulta o usuário atual;
7. retornar `Cache-Control: no-store` nas respostas de autenticação e tokens;
8. testar requisição sem CSRF, origem inválida, cookie ausente, token expirado, reutilização e logout.

`SameSite=Lax` continua útil, mas não deve ser a única barreira: subdomínios comprometidos, mudanças
de topologia e clientes diferentes podem alterar a proteção efetiva.

### Headers e endpoints operacionais

| Item | Decisão recomendada |
| --- | --- |
| CSP | começar em modo report-only, eliminar violações legítimas e então bloquear |
| Clickjacking | `frame-ancestors 'none'` ou política equivalente |
| MIME | `X-Content-Type-Options: nosniff` global |
| Referrer | política restritiva, especialmente nas páginas com token de verificação/reset |
| Permissões | desabilitar recursos de navegador não usados |
| HSTS | aplicar no proxy público após confirmar HTTPS em todos os subdomínios necessários |
| Swagger | desabilitar em produção ou proteger por rede/autenticação administrativa |
| Health | separar liveness de readiness e limitar detalhes de dependências no endpoint público |
| CORS | origem exata por ambiente, métodos e headers mínimos, sem reflexão dinâmica |

Marco: uma suíte de integração comprova cookies, CSRF, CORS, headers, JWT e exposição de endpoints.

## Etapa 2 — corrigir continuidade de sessão e minimização de dados

Objetivo: fazer a sessão de 30 dias se comportar como planejado sem ampliar a exposição de dados.

### Cliente HTTP único

Criar uma única função de transporte para todas as chamadas autenticadas:

```text
requisição autenticada
  -> sucesso: validar contrato e retornar
  -> 401 por expiração: executar um refresh single-flight
    -> refresh válido: repetir a requisição uma única vez
    -> refresh inválido: limpar estado, encerrar sessão e redirecionar
  -> 403: mostrar estado bloqueado ou ação necessária, sem tentar refresh infinito
```

Critérios:

- várias requisições simultâneas causam apenas um refresh;
- uma requisição é repetida no máximo uma vez;
- erros usam `ApiRequestError` e um catálogo de códigos estáveis, não texto livre como contrato;
- o middleware valida assinatura e expiração ou delega a decisão de sessão para uma fronteira
  confiável;
- mudanças de papel, status e versão de termos não causam loops de redirecionamento;
- o backend continua sendo a autoridade final.

### Minimização de dados

| Mudança | Critério |
| --- | --- |
| senha | `passwordHash` usa `select: false`; login faz seleção explícita e nenhum teste serializa o campo |
| JWT | contém somente claims necessárias à sessão |
| perfil | criar respostas diferentes para titular, equipe e terceiro; terceiro nunca recebe metadados do currículo corrente |
| arquivo | nome original, tamanho e identificador só aparecem para quem precisa executar a ação |
| auditoria | contexto passa por allowlist e teste impede token, senha, currículo, bio e descrições sensíveis |
| auth | eventos relevantes registram resultado e motivo seguro, sem credenciais ou enumeração de contas |

Marco: testes de contrato negativos comprovam que cada papel recebe apenas os campos necessários.

## Etapa 3 — abuso, uploads e retenção

Objetivo: controlar custo, spam e conteúdo hostil de forma consistente.

### Rate limiting

Substituir a identidade somente por IP por políticas compostas:

- login: IP e e-mail normalizado com mensagens genéricas;
- cadastro, reset e reenvio: IP e alvo normalizado, sem permitir bloqueio permanente da vítima;
- refresh: família de sessão e IP;
- denúncias: usuário, alvo e janela de criação;
- uploads e downloads sensíveis: usuário, finalidade e volume;
- endpoints públicos de busca: IP com limite mais amplo.

A limpeza de buckets expirados não deve executar um `DELETE` global em toda requisição. Mover a
manutenção para job periódico, usar TTL/particionamento quando necessário e monitorar bloqueios e
cardinalidade.

### Pipeline de arquivos

1. receber em área de quarentena com limite de corpo no proxy e na aplicação;
2. validar MIME, assinatura, extensão, quantidade e dimensões aplicáveis;
3. escanear por malware e rejeitar arquivos protegidos ou formatos não suportados;
4. para imagens, decodificar e reencodar com limites contra decompression bomb;
5. para PDF, considerar análise estrutural ou Content Disarm and Reconstruction;
6. promover para o bucket definitivo somente após aprovação;
7. aplicar criptografia, bloqueio de acesso público, credencial mínima e política de ciclo de vida;
8. adicionar timeout, retry limitado e circuit breaker às operações S3;
9. auditar download sensível e falha de scan sem armazenar o conteúdo.

### Retenção executável

Transformar `ApplicationRetentionService` em job recorrente e observável:

- executar ao menos diariamente, não apenas no bootstrap;
- processar lotes até esgotar a fila vencida, com limite por ciclo;
- impedir corrida entre réplicas com lock distribuído ou `SKIP LOCKED`;
- manter exclusão idempotente entre storage e banco;
- medir itens vencidos, removidos, falhos e idade do item mais antigo;
- alertar quando a fila vencida ultrapassar o prazo operacional;
- testar snapshots em todos os estados terminais e vagas encerradas.

Marco: abuso recebe `429` previsível, arquivo não aprovado nunca fica disponível e snapshot vencido
e elegível é removido dentro do SLA definido.

## Etapa 4 — LGPD, consistência e operação

Objetivo: transformar políticas documentadas em capacidades reais e recuperáveis.

### Direitos do titular e ciclo de dados

| Capacidade | Entrega mínima |
| --- | --- |
| inventário | finalidade, base legal, origem, visibilidade, retenção e destino de cada entidade/campo |
| acesso | exportação autenticada e auditada em formato estruturado |
| correção | cobertura dos dados que ainda não podem ser alterados pela interface |
| exclusão | fluxo com reautenticação, período de segurança, revogação de sessões e resultado rastreável |
| anonimização | preservar métricas e obrigações legais sem manter identidade desnecessária |
| consentimento | registrar e permitir revogação dos opcionais sem alterar os obrigatórios |
| retenção | política por usuários, termos, perfis, arquivos, candidaturas, denúncias, logs e auditoria |
| atendimento | runbook com identidade do solicitante, prazo, revisão e evidência da conclusão |

Decisões jurídicas sobre base legal e prazo precisam de responsável definido; o código não deve
inventá-las.

### Consistência dos fluxos

- tornar criação de usuário e aceites atômicos ou idempotentemente retomáveis;
- usar outbox para e-mail de verificação, reset e futuras notificações;
- impedir que falha do provedor deixe o usuário sem caminho de recuperação;
- adicionar chave de idempotência às mutações sujeitas a retry, como criação de vaga e candidatura;
- registrar transições de estado com ator, versão e motivo;
- testar falha em cada fronteira: banco, e-mail, storage e timeout de rede.

### Operação

- conexão TLS com PostgreSQL e validação de certificado em ambientes remotos;
- endpoints remotos HTTPS em produção, salvo exceção de rede privada documentada;
- banco e Compose local vinculados a `127.0.0.1`, evitando exposição acidental na rede local;
- backup automático criptografado, retenção definida e teste periódico de restauração;
- migrations com expansão/contração e plano de retorno;
- logs JSON com `requestId`, redaction, ambiente, versão e resultado;
- métricas e alertas para login, refresh reuse, `401`, `403`, `429`, `5xx`, latência, fila de
  moderação, e-mail, storage e retenção;
- runbooks de incidente, indisponibilidade, vazamento, credencial comprometida e restore.

Marco: restauração é demonstrada em ambiente isolado e os fluxos LGPD críticos possuem testes e
evidência operacional.

## Etapa 5 — qualidade e evolução do fluxo

Objetivo: reduzir abandono e suporte sem reabrir riscos já fechados.

| Fluxo | Melhoria | Critério de aceite |
| --- | --- | --- |
| cadastro | mensagens por campo, força de senha orientativa e retomada após falha recuperável | erro não apaga entrada e não revela existência de conta indevidamente |
| onboarding | checklist de pré-condições e próximo passo claro | usuário entende e resolve e-mail, termos, perfil, currículo e visibilidade |
| vaga | rascunho local ou persistido, aviso de saída e revisão antes de moderar | recarregar não perde trabalho; rascunho não fica público |
| candidatura | resumo final dos dados compartilhados e confirmação explícita | visibilidade nunca muda silenciosamente |
| processos | notificações assíncronas de decisão e mudança de status | envio é idempotente e preferência do usuário é respeitada |
| busca | filtros e página sincronizados com URL | link compartilhado restaura o mesmo resultado |
| ações críticas | substituir `window.confirm` por diálogo acessível e contextual | foco, teclado, cancelamento e consequência são testados |
| erros | estados consistentes para offline, timeout, sessão expirada, sem permissão e indisponibilidade | cada estado oferece ação recuperável |

Adicionar Playwright para os caminhos:

1. cadastro, confirmação de e-mail e onboarding;
2. expiração do access token, refresh e retomada da ação;
3. criação, moderação, busca e candidatura;
4. acesso positivo e negativo ao currículo preservado;
5. denúncia, decisão, suspensão e auditoria;
6. navegação por teclado e análise automatizada de acessibilidade.

Marco: os fluxos centrais passam em navegador real nos breakpoints definidos no plano de design.

## Sequência recomendada

| Ordem | Pacote de trabalho | Dependência | Tamanho relativo |
| --- | --- | --- | --- |
| 1 | CI, audit e atualização de patches | nenhuma | M |
| 2 | headers, Swagger, CSRF, cookies e JWT | pacote 1 | M |
| 3 | cliente HTTP, refresh single-flight e middleware | pacote 2 | M |
| 4 | minimização de senha, JWT, perfis e arquivos | pacote 2 | M |
| 5 | rate limits compostos e testes de abuso | pacotes 2 e 3 | M |
| 6 | retenção recorrente e observável | pacote 1 | M |
| 7 | quarentena e scan de uploads | pacotes 1 e 5 | L |
| 8 | E2E dos fluxos críticos | pacotes 2 a 7 | L |
| 9 | LGPD, outbox, backup e observabilidade | base estabilizada | L |
| 10 | rascunhos, URL de busca, notificações e refinamentos UX | gates P0 concluídos | L |

Referência de tamanho: S até um dia, M aproximadamente dois a quatro dias e L cinco dias ou mais
para uma pessoa, incluindo teste e documentação. Reestimar após o primeiro pacote.

## Primeiro lote recomendado

O primeiro lote deve ser pequeno o suficiente para revisão segura e entregar:

1. CI com todos os comandos já verdes localmente;
2. atualização de Next.js e TypeORM e triagem dos demais alertas;
3. headers globais, Swagger condicionado ao ambiente e `no-store` em autenticação;
4. teste que demonstra a ausência atual de CSRF e, em seguida, sua correção;
5. `passwordHash` fora das seleções padrão;
6. resposta pública/restrita de perfil sem metadados do currículo;
7. rate limit para criação de denúncia;
8. job recorrente de retenção com métrica e teste;
9. atualização dos runbooks afetados.

Evitar misturar nesse lote o redesenho completo da interface, a outbox e o pipeline antimalware.
Esses itens dependem da fronteira de sessão e da operação já estabilizadas.

## Definição de pronto transversal

Uma melhoria deste plano só está concluída quando:

- possui cenário de ameaça ou falha descrito;
- tem teste positivo, negativo e de concorrência quando aplicável;
- não expõe segredo ou dado pessoal em resposta, log, métrica ou fixture;
- atualiza contrato compartilhado e Swagger quando a API muda;
- inclui migration forward-only quando o banco muda;
- passa por format check, lint, typecheck, testes, integração, E2E aplicável, build e audit;
- documenta configuração, rollout, rollback e observabilidade;
- registra evidência no arquivo de execução correspondente;
- foi validada nos papéis afetados e em teclado quando há interface.

## Gates para beta pública

A beta com dados reais só deve avançar quando:

- não houver alerta crítico ou alto de produção sem exceção formal válida;
- CSRF, cookies, CORS, headers e exposição do Swagger estiverem testados;
- refresh funcionar automaticamente sem loop ou repetição ilimitada;
- cada papel receber somente os dados necessários;
- denúncias, autenticação e arquivos tiverem proteção contra abuso;
- snapshots vencidos tiverem rotina recorrente e monitorada;
- backup e restauração tiverem evidência recente;
- os fluxos centrais passarem no CI e no E2E de navegador;
- logs e alertas permitirem detectar falhas sem registrar dados sensíveis;
- política de privacidade, retenção e canal de atendimento ao titular estiverem publicados.

## Indicadores de acompanhamento

| Indicador | Uso |
| --- | --- |
| vulnerabilidades por severidade e idade | impedir acúmulo de risco de supply chain |
| sucesso e falha de refresh | detectar expiração indevida e roubo/reutilização de sessão |
| taxa de `401`, `403`, `429` e `5xx` por rota | encontrar abuso, autorização incorreta e regressão |
| tempo e abandono de onboarding/candidatura | priorizar melhorias reais de fluxo |
| idade do snapshot vencido mais antigo | verificar cumprimento de retenção |
| tempo de decisão de vaga e denúncia | acompanhar gargalos de moderação |
| falhas e latência de e-mail/storage | detectar dependências degradadas |
| restauração mais recente comprovada | garantir que backup é recuperável |
| violações de acessibilidade e E2E | impedir regressão de interface |

As metas numéricas devem ser definidas após obter uma linha de base em staging e na beta; inventar
limites antes de medir pode esconder problemas em vez de orientá-los.

## Riscos de rollout

| Mudança | Risco | Mitigação |
| --- | --- | --- |
| nomes e escopo de cookies | encerrar sessões existentes | aceitar formato antigo por janela curta e comunicar o logout planejado |
| CSRF | bloquear clientes legítimos | report-only/telemetria de origem antes do bloqueio e testes por cliente |
| dependências | alteração incompatível | lotes pequenos, lockfile revisado e rollback pelo artefato anterior |
| contrato de perfil | quebrar componentes consumidores | criar schemas por audiência antes de remover campos |
| retenção | apagar item ainda necessário | dry-run, query auditável, backup e lote limitado |
| scan de arquivos | aumentar latência | quarentena assíncrona e estado visível de processamento |
| outbox | duplicar mensagens | chave idempotente e consumidor at-least-once seguro |

## Decisão arquitetural recomendada

Manter NestJS, Next.js, PostgreSQL e o monólito modular. Antes de considerar microserviços, introduzir
apenas as capacidades transversais necessárias:

- fronteira same-origin ou BFF para sessão;
- fila/outbox para trabalhos assíncronos;
- scheduler com lock para retenção;
- storage com quarentena;
- observabilidade e CI.

Essa evolução resolve os riscos encontrados sem criar custo operacional incompatível com o estágio
do MVP.
