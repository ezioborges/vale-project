# Runbook — ambientes e promoção

O Vale Project deve operar com ambientes isolados. Banco, credenciais, cookies e dados não são
compartilhados entre eles.

## Topologia HTTP oficial

Em produção, navegador, Web e API usam uma única origem pública HTTPS. O proxy encaminha
`/api/*` para o NestJS removendo o prefixo `/api`; as demais rotas seguem para o Next.js. Por
exemplo, o navegador acessa `https://vale.example/api/auth/login`, enquanto o controller recebe
`/auth/login`.

Essa topologia é obrigatória porque mantém os cookies host-only sem configurar `Domain`, reduz CORS
a uma origem exata e permite os prefixos `__Host-` e `__Secure-`. O refresh permanece restrito ao
path `/api/auth` e, por isso, decisões de sessão das páginas são delegadas pelos layouts Web à API,
não ao middleware. O proxy deve preservar `Origin`, `Referer`, `Cookie`, `Set-Cookie` e
`X-CSRF-Token` nas rotas `/api/*` e limitar o corpo das requisições.

Em desenvolvimento local, Web e API continuam em portas diferentes de `localhost`. Nesse caso,
`API_CORS_ORIGIN=http://localhost:3000`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` e o
path do refresh é `/auth`.

| Ambiente | Aplicação e banco | Dados permitidos | Promoção |
| --- | --- | --- | --- |
| Local | processos locais e PostgreSQL no Compose | somente fictícios | livre e descartável |
| Desenvolvimento | deploy e PostgreSQL próprios | sintéticos ou anonimizados | após integração e CI |
| Staging | topologia equivalente à produção | ensaio controlado e minimizado | aprovação para homologação |
| Produção | recursos exclusivos | dados reais conforme finalidade e política | aprovação humana |

## Configuração por ambiente

| Variável | Finalidade | Regra |
| --- | --- | --- |
| `NODE_ENV` | ativa comportamento de desenvolvimento ou produção | `production` nos deploys públicos |
| `API_PORT` | porta HTTP da API | definida pela plataforma quando necessário |
| `API_CORS_ORIGIN` | origem web autorizada | URL exata do frontend daquele ambiente |
| `TRUST_PROXY_HOPS` | proxies confiáveis usados para obter o IP do cliente | `0` local; definir pela topologia publicada |
| `WEB_APP_URL` | origem usada nos links enviados por e-mail | URL pública do frontend |
| `DATABASE_*` | conexão PostgreSQL | credenciais exclusivas por ambiente |
| `JWT_ACCESS_SECRET` | assinatura do access token | segredo aleatório com pelo menos 32 caracteres |
| `JWT_ISSUER` / `JWT_AUDIENCE` | destinatário e emissor esperados no access token | valores explícitos e estáveis por ambiente |
| `JWT_ACCESS_TTL_SECONDS` | duração do access token | curta; padrão local de 900 segundos |
| `REFRESH_TOKEN_TTL_DAYS` | validade máxima do refresh token | revisar conforme política de sessão |
| `REFRESH_COOKIE_PATH` | escopo do refresh cookie | `/auth` local; obrigatoriamente `/api/auth` em produção |
| `SWAGGER_ENABLED` | exposição local da documentação | permitido fora de produção; recusado em produção |
| `EMAIL_VERIFICATION_TTL_HOURS` | validade da verificação de e-mail | padrão local de 24 horas |
| `PASSWORD_RESET_TTL_MINUTES` | validade do reset de senha de uso único | entre 5 e 60 minutos; padrão 15 |
| `LEGAL_*_VERSION` | versões de termos, privacidade e diretrizes | publicar e atualizar de forma coordenada |
| `EMAIL_PROVIDER` | adapter de entrega | `log` local; obrigatoriamente `http` em produção |
| `EMAIL_HTTP_*` | endpoint e credencial do gateway remoto | obrigatórios e secretos em produção |
| `STORAGE_DRIVER` | adapter de arquivos de perfil | `local` em desenvolvimento; obrigatoriamente `s3` em produção |
| `PROFILE_STORAGE_ROOT` | diretório privado do adapter local | fora da árvore pública e com dados fictícios |
| `FILE_SCAN_DRIVER` | inspeção antimalware | `disabled` somente local/teste; obrigatoriamente `clamav` em produção |
| `CLAMAV_*` | daemon, porta e timeout de inspeção | rede privada, assinaturas atualizadas e acesso somente pela API |
| `RATE_LIMIT_CLEANUP_INTERVAL_SECONDS` | manutenção de buckets expirados | job periódico; nunca executar limpeza no caminho da requisição |
| `S3_*` | endpoint, bucket, credenciais, timeout, retry e circuito | obrigatórios e secretos quando o driver for `s3` |
| `RETENTION_JOB_*` | frequência, lote e teto de snapshots por ciclo | intervalo máximo diário; calibrar após medir a fila |
| `RETENTION_ALERT_AGE_SECONDS` | SLA do vencido mais antigo | alerta inicial de 24 horas |
| `SEED_ADMIN_*` | bootstrap local de admin | ausente em produção |
| `NEXT_PUBLIC_API_BASE_URL` | endereço usado pelo navegador | `/api` em produção; não pode conter segredo |

Arquivos `.env` não são versionados. Variáveis remotas ficam no cofre da plataforma. Nunca exponha
segredos em variáveis `NEXT_PUBLIC_*`, logs, tickets ou screenshots.

O bootstrap recusa produção quando Web e CORS não usam a mesma origem HTTPS, o path do refresh não
é `/api/auth`, Swagger está habilitado, segredo JWT, CORS ou credenciais de banco ainda usam os
valores locais da `.env.example`, o provider remoto de e-mail não está completo, o storage local
está selecionado, faltam parâmetros S3/R2 ou o ClamAV não está configurado.

## Ordem de promoção

1. instalar dependências com `pnpm install --frozen-lockfile`;
2. executar `pnpm validate` e `pnpm audit:prod` na revisão exata que será promovida;
3. gerar backup e plano de retorno quando a migration tocar dados existentes ou remover estrutura;
4. aplicar migrations forward-only no banco do ambiente;
5. promover a API compatível com o schema;
6. promover o frontend;
7. verificar `/api/health/live`, `/api/health/ready` e os fluxos críticos de autenticação; Swagger
   não é exposto em produção;
8. registrar versão, horário, executor, SHA do lockfile, migrations aplicadas, artefatos da CI e
   resultado da verificação.

Migrations entram antes do código que depende delas. Mudanças incompatíveis devem usar expansão e
contração: adicionar estrutura compatível, migrar uso/dados e remover a estrutura antiga somente em
uma entrega posterior.

## Verificação pós-promoção

- liveness confirma o processo sem depender do banco e readiness confirma a conexão necessária;
- cadastro público não aceita papéis internos;
- access e refresh são HttpOnly, `Secure`, host-only e usam o prefixo e path esperados;
- mutações por cookie rejeitam CSRF ausente e origem divergente;
- refresh rotaciona e o token anterior deixa de funcionar;
- contas suspensas ou desabilitadas não autenticam;
- endpoint administrativo rejeita atores sem papel admin;
- logs não contêm senha, access token, refresh token ou token de verificação;
- upload de teste autorizado é privado, e um papel sem acesso recebe `403`;
- arquivo EICAR de staging é rejeitado sem objeto aprovado nem conteúdo no log;
- bucket bloqueia acesso público, usa criptografia, credencial sem administração e lifecycle que
  remove quarentena órfã depois da janela operacional;
- logs mostram conclusão do ciclo de retenção e alertam quando o vencido mais antigo excede o SLA;
- `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` não existem em produção.

O proxy deve limitar `/api/profiles/files` a 6 MiB e o daemon ClamAV não deve ser exposto à
internet. A credencial S3 da aplicação acessa somente os prefixos necessários e não altera policy,
ACL, lifecycle ou configuração do bucket. Monitore latência/falha de scan, abertura do circuito,
`429`, cardinalidade de buckets e idade do snapshot vencido mais antigo.

HSTS deve ser aplicado no proxy público somente após confirmar HTTPS em todos os subdomínios
incluídos pela política. CSP começa em `Content-Security-Policy-Report-Only`; as violações legítimas
devem ser eliminadas antes da migração para bloqueio.

## Estado atual

A separação está documentada, mas os recursos remotos, responsáveis, política de backup,
observabilidade e provedor de e-mail ainda precisam ser definidos. Este runbook não autoriza criar
ou alterar ambientes remotos.
