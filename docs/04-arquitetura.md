# Arquitetura Inicial

## Visao de alto nivel

O Vale Project deve iniciar como uma arquitetura modular com frontend Next.js e backend NestJS separados, comunicando-se por API HTTP/JSON. A separacao permite evoluir backend, frontend, autenticacao, testes e deploy com responsabilidades claras.

```text
Usuario
  -> Next.js Web App
    -> NestJS API
      -> PostgreSQL
      -> Servicos auxiliares futuros: e-mail, storage, fila, observabilidade
```

## Estrutura futura sugerida

```text
vale-project/
  apps/
    api/
      src/
        modules/
          auth/
          users/
          profiles/
          jobs/
          applications/
          moderation/
          audit/
        common/
        database/
    web/
      app/
      components/
      features/
      lib/
  packages/
    shared/
  docs/
```

## Backend NestJS

| Modulo | Responsabilidade |
|---|---|
| auth | Login, logout, refresh token, recuperacao de senha, verificacao de e-mail e guards. |
| users | Conta base, papel principal, status, dados de autenticacao e administracao. |
| profiles | Perfis de candidato e contratante. |
| jobs | Criacao, edicao, publicacao, busca e status de vagas. |
| applications | Candidaturas, status e historico do processo. |
| moderation | Denuncias, fila de analise, decisoes e suspensoes. |
| audit | Registro de eventos sensiveis. |
| notifications | Envio futuro de e-mails e avisos. |

## Frontend Next.js

| Area | Responsabilidade |
|---|---|
| app | Rotas, layouts e paginas por papel. |
| features/auth | Login, cadastro, recuperacao de senha e onboarding. |
| features/candidate | Perfil, curriculo, busca de vagas e candidaturas. |
| features/employer | Perfil do contratante, vagas e candidatos. |
| features/moderation | Painel de coordenadores. |
| features/admin | Gestao administrativa. |
| lib/api | Cliente HTTP, interceptadores e tratamento de erros. |
| components | Componentes reutilizaveis de UI. |

## RBAC

O RBAC deve ser aplicado em duas camadas:

| Camada | Funcao |
|---|---|
| Backend | Fonte de verdade da autorizacao. Guards verificam autenticacao, papel e permissoes. |
| Frontend | Experiencia de usuario. Rotas e componentes ocultam acoes nao permitidas, mas nao substituem o backend. |

## Papeis e permissoes iniciais

| Recurso | Admin | Coordenador | Contratante | Contratado |
|---|---:|---:|---:|---:|
| Gerenciar usuarios | Sim | Parcial | Nao | Nao |
| Alterar papeis | Sim | Nao | Nao | Nao |
| Moderar vagas | Sim | Sim | Nao | Nao |
| Analisar denuncias | Sim | Sim | Nao | Nao |
| Publicar vagas | Nao | Nao | Sim | Nao |
| Gerenciar proprias vagas | Nao | Nao | Sim | Nao |
| Criar perfil profissional | Nao | Nao | Nao | Sim |
| Candidatar-se | Nao | Nao | Nao | Sim |
| Ver auditoria | Sim | Parcial | Nao | Nao |

## Padroes tecnicos recomendados

| Tema | Recomendacao |
|---|---|
| Validacao | DTOs no NestJS e schemas no frontend. |
| Erros | Exception filters no backend e padrao de erro consistente para o frontend. |
| Banco | TypeORM com migrations versionadas. |
| API | OpenAPI/Swagger para documentacao. |
| Configuracao | Variaveis de ambiente tipadas e validadas. |
| Autenticacao | Access token curto, refresh token rotativo e revogavel. |
| Auditoria | Eventos emitidos por services em operacoes sensiveis. |

## Estados principais

| Entidade | Estados sugeridos |
|---|---|
| Usuario | `pending_email`, `active`, `suspended`, `disabled` |
| Vaga | `draft`, `pending_review`, `approved`, `rejected`, `paused`, `closed`, `reported` |
| Candidatura | `submitted`, `under_review`, `shortlisted`, `rejected`, `cancelled` |
| Denuncia | `open`, `in_review`, `resolved`, `dismissed` |
