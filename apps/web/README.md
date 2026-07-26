# Web

Aplicacao frontend Next.js do Vale Project.

## Stack planejada

| Item           | Tecnologia                                 |
| -------------- | ------------------------------------------ |
| Framework      | Next.js                                    |
| UI             | React 19                                   |
| Testes         | Testing Library e ferramenta E2E a definir |
| Acessibilidade | WCAG como referencia                       |

## Areas sugeridas

| Area       | Responsabilidade                                           |
| ---------- | ---------------------------------------------------------- |
| auth       | Login, cadastro, recuperacao de senha e onboarding.        |
| candidate  | Perfil profissional, curriculo, busca e candidaturas.      |
| employer   | Perfil institucional, vagas e candidaturas recebidas.      |
| moderation | Painel de coordenadores.                                   |
| admin      | Gestao de usuarios, papeis e auditoria.                    |
| shared     | Componentes reutilizaveis, layout, formularios e feedback. |

## Principios de implementacao

| Principio       | Diretriz                                                                |
| --------------- | ----------------------------------------------------------------------- |
| Rotas por papel | Redirecionar usuarios conforme role e status da conta.                  |
| Acessibilidade  | Labels, foco visivel, contraste adequado e navegacao por teclado.       |
| Inclusao        | Linguagem neutra, acolhedora e sem pressupor genero.                    |
| Validacao       | Validar formularios no cliente e confiar na validacao final do backend. |
| Estados         | Tratar loading, erro, vazio e sucesso em fluxos criticos.               |

## Comandos

```bash
pnpm --filter @vale/web dev
pnpm --filter @vale/web test
pnpm --filter @vale/web build
```

## Estrutura inicial

| Area         | Uso                                 |
| ------------ | ----------------------------------- |
| `app`        | Rotas e layout principal.           |
| `components` | Componentes reutilizaveis de UI.    |
| `lib/api.ts` | Cliente HTTP validado por contrato. |

## Rotas entregues

| Rota                          | Uso                                               |
| ----------------------------- | ------------------------------------------------- |
| `/vagas`, `/vagas/[id]`       | Busca pública, detalhe e candidatura segura.      |
| `/app/candidato`              | Perfil e arquivos profissionais.                  |
| `/app/candidato/candidaturas` | Acompanhamento, histórico e cancelamento.         |
| `/app/candidato/denuncias`    | Acompanhamento limitado das próprias denúncias.   |
| `/app/contratante`            | Perfil institucional.                             |
| `/app/contratante/vagas`      | Gestão de vagas e candidaturas recebidas.         |
| `/app/contratante/denuncias`  | Acompanhamento das próprias denúncias.            |
| `/app/equipe/moderacao`       | Fila de moderação de vagas.                       |
| `/app/equipe/denuncias`       | Triagem e decisão de denúncias.                   |
| `/admin/usuarios`             | Papéis e estados de conta com motivo obrigatório. |
| `/admin/auditoria`            | Consulta restrita da trilha de eventos.           |

O middleware direciona por papel e status, enquanto cada operação sensível continua autorizada pela
API. Respostas de domínio são validadas por schemas compartilhados antes de chegar aos componentes.
