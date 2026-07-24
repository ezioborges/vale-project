# Runbook — setup local do zero

Este procedimento parte de uma máquina limpa e termina com banco migrado, API, Swagger e aplicação
web disponíveis.

## 1. Pré-requisitos

| Ferramenta | Versão |
| --- | --- |
| Git | versão estável atual |
| Node.js | 22 ou superior |
| pnpm | 10.12.1, ativado pelo Corepack |
| Docker | Engine ou Docker Desktop com Compose |

Confirme:

```bash
git --version
node --version
corepack --version
docker version
docker compose version
```

No Windows com WSL 2, habilite a integração da distribuição no Docker Desktop. `docker version`
executado dentro do WSL precisa mostrar cliente e servidor.

## 2. Instalação reproduzível

Na raiz do repositório:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

O arquivo `.env` é local e ignorado pelo Git. Não copie credenciais de desenvolvimento compartilhado,
staging ou produção.

## 3. Banco e migrations

Inicie somente o PostgreSQL:

```bash
pnpm db:up
docker compose ps
```

Espere o serviço `postgres` ficar `healthy` e aplique as migrations:

```bash
pnpm --filter @vale/api migration:run
```

O TypeORM usa `synchronize: false`; iniciar o container não cria as tabelas da aplicação. Por isso,
executar as migrations é obrigatório em uma base nova.

Para criar um admin local controlado, adicione ao `.env` antes de iniciar a API:

```dotenv
SEED_ADMIN_EMAIL=admin@local.vale.test
SEED_ADMIN_PASSWORD=troque-esta-senha-local
```

Use apenas identidade fictícia. As duas variáveis devem existir juntas, e o seed é ignorado em
produção.

## 4. Iniciar a aplicação

```bash
pnpm dev
```

| Serviço | URL |
| --- | --- |
| Web | `http://localhost:3000` |
| API health | `http://localhost:3001/health` |
| Swagger | `http://localhost:3001/docs` |

No ambiente local, o cadastro retorna um token de verificação de e-mail para o formulário da página
inicial. Esse comportamento substitui temporariamente o provider fake/log e é desabilitado quando
`NODE_ENV=production`.

## 5. Validar a fundação

Em outro terminal:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Confirme também:

```bash
curl --fail http://localhost:3001/health
curl --fail --output /dev/null http://localhost:3001/docs
```

## 6. Encerrar

Interrompa `pnpm dev` com `Ctrl+C` e depois execute:

```bash
pnpm db:down
```

O volume nomeado do PostgreSQL é preservado. Remover volumes apaga dados locais e exige decisão
explícita; não use esse procedimento como solução padrão de troubleshooting.

## Problemas comuns

### `Cannot connect to the Docker daemon`

Inicie o Docker. No WSL 2, confira a integração da distribuição e reabra o terminal.

### Porta 5432 já está ocupada

Verifique `docker compose ps` e os processos locais. Não altere silenciosamente a porta do projeto;
se a mudança for necessária, atualize Compose, `.env.example` e este runbook juntos.

### API inicia, mas uma operação informa que a tabela não existe

Execute `pnpm --filter @vale/api migration:run` com o PostgreSQL saudável. Não habilite
`synchronize`.

### Falha de variável de ambiente

Compare `.env` com `.env.example`. Para produção, não dependa dos valores locais padrão definidos no
schema; configure segredos e origens explicitamente.

### Migration falha

Leia a primeira migration com erro e corrija a migration ainda não integrada. Não edite o banco
manualmente para esconder divergência. Reversão em base compartilhada exige avaliação de dados e
plano específico.
