# Inventário da fundação de interface

- Data: 2026-07-27
- Plano de origem: [Etapa 1 do plano de aplicação](12-plano-aplicacao-design.md#etapa-1--consolidar-a-fundação)
- Estado: fundação implementada; CSS legado permanece em convivência controlada até a migração de cada fluxo.

## Fonte de verdade

Os tokens vivem em `apps/web/app/globals.css` e as primitivas em
`apps/web/components/ui`. A rota `/laboratorio-ui` consome as mesmas primitivas; ela deixou de ser
um conjunto de exemplos copiados localmente.

| Camada | Itens entregues | Regra de uso |
| --- | --- | --- |
| Tokens | superfície, texto, borda, ação, foco, sucesso, informação, atenção, erro, espaçamento, raio, sombra, contêiner e movimento | preferir o nome semântico `vale-*`; os aliases cromáticos do laboratório são temporários |
| Ações | `Button`, `ActionLink`, `IconButton` | usar `primary` para a ação principal, `secondary` para alternativa, `ghost` para ação de baixa ênfase e `danger` apenas para ação destrutiva |
| Formulários | `FormField`, `TextInput`, `TextArea`, `Select`, `CheckboxField`, `RadioCard` | usar `FormField` para associar rótulo, ajuda e erro ao controle; nunca usar placeholder como rótulo |
| Feedback | `Badge`, `Alert`, `LoadingState`, `EmptyState`, `Progress` | sempre fornecer texto explicativo; cor e ícone apenas reforçam o significado |
| Superfícies | `Card`, `PageHeading`, `Container` | manter conteúdo em contêiner responsivo e usar card somente para agrupar informação relacionada |
| Sobreposição | `Dialog` | componente controlado, com foco nativo no modal, Escape, clique no fundo e confirmação explícita |
| Layout | `PageLayout` com `public`, `authenticated` e `administrative` | escolher o contexto de acesso sem acoplar papel, permissão ou regra de domínio ao componente |

O sistema respeita `prefers-reduced-motion`: rolagem, transições e animações são reduzidas pela
folha global, além das variantes `motion-reduce` das primitivas animadas.

## Contrato de acessibilidade e teclado

| Primitiva | Comportamento obrigatório | Limite de uso |
| --- | --- | --- |
| `Button` e `ActionLink` | foco visível, alvo de pelo menos 44 px e estado desabilitado comunicável | não usar `danger` como estilo decorativo |
| `IconButton` | `label` gera `aria-label` e `title` | não usar sem uma ação específica e identificável |
| `FormField` | `label` aponta ao controle; ajuda e erro entram em `aria-describedby`; erro usa `role=alert` | o filho deve ser um controle do sistema |
| `CheckboxField` e `RadioCard` | controle nativo continua navegável por Tab, Espaço e setas do navegador | não substituir por `div` com clique |
| `Alert` | sucesso/informação/atenção usam `role=status`; erro usa `role=alert` | não anunciar atualizações sem motivo relevante |
| `LoadingState` e `Progress` | texto e progresso nativo informam o estado sem depender de animação | carregamento não deve esconder a ação de recuperar de erro |
| `Dialog` | foco é contido pelo elemento nativo; Escape e fundo pedem fechamento; botões têm ordem cancelamento/confirmação | confirmação não substitui autorização da API nem deve ser usada para ação reversível simples |

## Guia curto de conteúdo

| Elemento | Convenção |
| --- | --- |
| Título | dizer onde a pessoa está ou o resultado que alcançará: “Criar perfil”, não “Formulário”. |
| Rótulo | nomear o dado de forma curta: “E-mail”, “Modalidade”. |
| Ajuda | explicar finalidade, visibilidade, formato ou consequência antes da pessoa enviar o dado. |
| Validação | dizer o que corrigir e como: “Informe um e-mail válido”; nunca “Erro 400”. |
| Erro geral | preservar dados seguros, orientar uma nova tentativa e não expor detalhe interno. |
| Sucesso | confirmar o efeito e indicar o próximo passo real. |
| Linguagem | usar termos inclusivos, sem presumir gênero, identidade, capacidade, família ou trajetória. |

Dados de identidade ou outros dados sensíveis permanecem opcionais e precisam informar finalidade e
visibilidade no fluxo de domínio. A fundação visual não altera validações, consentimentos ou
autorização do backend.

## Inventário do CSS legado

`apps/web/app/globals.css` ainda contém os seletores das rotas funcionais já entregues. Eles não
devem ser apagados por uma migração visual isolada: cada grupo só pode sair depois de a rota e seus
estados estarem no novo sistema e de uma busca não encontrar consumidores.

| Grupo legado | Principais seletores | Consumidores atuais | Substituto | Remoção segura |
| --- | --- | --- | --- | --- |
| Casca pública e identidade | `.app-shell`, `.topbar`, `.workspace`, `.auth-panel`, `.segmented-control`, `.auth-form`, `.primary-action`, `.secondary-action`, `.text-action` | `/`, `/recuperar-senha`, `/conta-indisponivel`, `SessionBoundary`, onboarding | `PageLayout`, `Container`, ações e campos de `ui` | ao concluir a Etapa 2, depois de migrar login, cadastro, recuperação e seus estados |
| Perfil e privacidade | `.profile-workspace`, `.profile-overview`, `.form-section`, `.field-grid`, `.choice-grid`, `.asset-*`, `.visibility-*` | onboarding, perfil de pessoa candidata, perfil de contratante e privacidade | layout autenticado, `Card`, formulário e feedback de `ui` | ao concluir a Etapa 3 e não haver referência a esses seletores |
| Mercado e candidaturas | `.jobs-*`, `.job-*`, `.application-*`, `.management-*`, `.status-*` | `/vagas`, detalhe de vaga, candidaturas e gestão de vagas | layout autenticado, card, badge, filtros, vazio, carregamento e diálogo | ao concluir a Etapa 4 e validar busca, candidatura, gestão e moderação de vagas |
| Governança | `.report-*`, `.admin-*`, `.audit-*`, `.decision-history` | denúncias, equipe, usuários e auditoria | layout administrativo, ações, formulário, alertas, badge, diálogo e estados | ao concluir a Etapa 5 e validar as permissões negativas da API |
| Aliases do laboratório | `vale-violet`, `vale-pink`, `vale-blue`, `vale-green`, `vale-orange`, `vale-yellow`, `vale-line`, `vale-soft` | `/laboratorio-ui` e trechos ainda não extraídos | tokens semânticos `vale-action`, `vale-info`, `vale-success`, `vale-warning`, `vale-border` e `vale-*-subtle` | somente após migrar todos os exemplos do laboratório e confirmar que o tema não os gera mais |

Antes de qualquer remoção, executar:

```bash
rg -n 'nome-do-seletor|nome-do-token' apps/web/app apps/web/components
corepack pnpm --filter @vale/web typecheck
corepack pnpm --filter @vale/web lint
corepack pnpm --filter @vale/web test
corepack pnpm --filter @vale/web build
```

## Qualidade e regressão

`apps/web/components/ui/ui-contract.test.tsx` verifica as variantes e semântica críticas: ação em
espera, botão de ícone nomeado, associação de rótulo/ajuda/erro, alertas, vazio, progresso e diálogo.
O Vitest usa a transformação JSX automática para que esses testes renderizem as primitivas como o
frontend.

A regressão visual continua proporcional a cada rota migrada. Antes de aprovar um lote, conferir no
laboratório e no fluxo integrado: 320 px, 768 px, 1280 px ou mais, zoom de 200%, navegação apenas
por teclado, preferência de redução de movimento, carregamento, vazio, erro, sucesso, bloqueio e
falta de permissão aplicáveis. O [runbook](../runbooks/aplicar-design-system.md) mantém o checklist
operacional completo.
