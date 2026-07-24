# Runbook — ambientes e promoção

O Vale Project deve operar com ambientes isolados. Banco, credenciais, cookies e dados não são
compartilhados entre eles.

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
| `JWT_ACCESS_TTL_SECONDS` | duração do access token | curta; padrão local de 900 segundos |
| `REFRESH_TOKEN_TTL_DAYS` | validade máxima do refresh token | revisar conforme política de sessão |
| `EMAIL_VERIFICATION_TTL_HOURS` | validade da verificação de e-mail | padrão local de 24 horas |
| `PASSWORD_RESET_TTL_MINUTES` | validade do reset de senha de uso único | entre 5 e 60 minutos; padrão 15 |
| `LEGAL_*_VERSION` | versões de termos, privacidade e diretrizes | publicar e atualizar de forma coordenada |
| `EMAIL_PROVIDER` | adapter de entrega | `log` local; obrigatoriamente `http` em produção |
| `EMAIL_HTTP_*` | endpoint e credencial do gateway remoto | obrigatórios e secretos em produção |
| `SEED_ADMIN_*` | bootstrap local de admin | ausente em produção |
| `NEXT_PUBLIC_API_BASE_URL` | endereço público da API | não pode conter segredo |

Arquivos `.env` não são versionados. Variáveis remotas ficam no cofre da plataforma. Nunca exponha
segredos em variáveis `NEXT_PUBLIC_*`, logs, tickets ou screenshots.

O bootstrap recusa produção quando segredo JWT, CORS ou credenciais de banco ainda usam os valores
locais da `.env.example`, e também quando o provider remoto de e-mail não está completo.

## Ordem de promoção

1. instalar dependências com `pnpm install --frozen-lockfile`;
2. executar lint, typecheck, testes e build na revisão exata que será promovida;
3. gerar backup e plano de retorno quando a migration tocar dados existentes ou remover estrutura;
4. aplicar migrations forward-only no banco do ambiente;
5. promover a API compatível com o schema;
6. promover o frontend;
7. verificar `/health`, `/docs` quando permitido e os fluxos críticos de autenticação;
8. registrar versão, horário, executor, migrations aplicadas e resultado da verificação.

Migrations entram antes do código que depende delas. Mudanças incompatíveis devem usar expansão e
contração: adicionar estrutura compatível, migrar uso/dados e remover a estrutura antiga somente em
uma entrega posterior.

## Verificação pós-promoção

- health check confirma aplicação e banco;
- cadastro público não aceita papéis internos;
- cookies são HttpOnly, `Secure` e possuem o domínio esperado;
- refresh rotaciona e o token anterior deixa de funcionar;
- contas suspensas ou desabilitadas não autenticam;
- endpoint administrativo rejeita atores sem papel admin;
- logs não contêm senha, access token, refresh token ou token de verificação;
- `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` não existem em produção.

## Estado atual

A separação está documentada, mas os recursos remotos, responsáveis, política de backup,
observabilidade e provedor de e-mail ainda precisam ser definidos. Este runbook não autoriza criar
ou alterar ambientes remotos.
