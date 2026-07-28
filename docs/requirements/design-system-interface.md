# Execução transversal — laboratório e fundação de interface

- Data da verificação: 2026-07-27
- Plano de origem:
  [`../planos-de-acao/12-plano-aplicacao-design.md`](../planos-de-acao/12-plano-aplicacao-design.md)
- Decisão arquitetural:
  [`../adr/0002-design-system-interface.md`](../adr/0002-design-system-interface.md)
- Estado: fundação reutilizável e aplicação nas jornadas de identidade, perfil, mercado e governança
  implementadas localmente; auditoria manual de navegador continua pendente.

## Escopo entregue

- rota pública `/laboratorio-ui` com tokens, primitivas e exemplos navegáveis;
- tema Tailwind com tokens semânticos e Font Awesome Free;
- primitivas compartilhadas de ação, campo, feedback, card, layout, badge e diálogo;
- moldura comum para a área autenticada;
- aplicação do padrão nas jornadas de identidade e perfil;
- etapa 4 de mercado aplicada em busca, detalhe, candidatura, acompanhamento, gestão e moderação de
  vagas;
- etapa 5 de governança aplicada em equipe, denúncias, administração e auditoria;
- filtros removíveis, paginação e indicação da ordenação estável definida pela API;
- revisão consciente dos dados compartilhados na candidatura e revisão antes de enviar uma vaga;
- confirmação contextual para cancelar candidatura e encerrar vaga;
- componentes compartilhados `JobStatusBadge`, `ApplicationStatusBadge` e `JobMetadata`, usados em
  produção e no laboratório;
- componentes compartilhados `ReportStatusBadge` e `Pagination`, usados em produção e no laboratório;
- testes de contrato das primitivas, das jornadas de mercado e de governança.

## Rastreabilidade

| Requisito | Estado | Evidência |
| --- | --- | --- |
| UI-RF-01 — disponibilizar referência navegável | Atendido | `apps/web/app/laboratorio-ui/page.tsx` |
| UI-RF-02 — representar cadastro por papel | Atendido | `apps/web/components/auth-panel.tsx` |
| UI-RF-03 — representar contratação e serviços | Atendido para o mercado de vagas | `jobs-search.tsx`, `job-detail.tsx`, `candidate-applications.tsx`, `employer-job-manager.tsx` e `moderation-queue.tsx` |
| UI-RF-04 — documentar plano de aplicação | Atendido | `docs/planos-de-acao/12-plano-aplicacao-design.md` |
| UI-RF-05 — disponibilizar apresentação visual | Atendido | imagem incorporada ao índice e ao plano de aplicação |
| UI-RNF-01 — usar Tailwind | Atendido | tema e utilitários processados pelo PostCSS |
| UI-RNF-02 — usar biblioteca de ícones | Atendido | Font Awesome Free |
| UI-RNF-03 — manter fundo claro e contraste | Implementado; auditoria manual pendente | canvas, superfícies e tokens semânticos |
| UI-RNF-04 — comunicar estado além da cor | Atendido | badges, alertas e orientações textuais por estado |
| UI-RNF-05 — navegação por teclado e foco visível | Implementado; auditoria manual pendente | controles nativos, diálogo e foco explícito |
| UI-RNF-06 — responsividade | Implementado; auditoria visual pendente | grades, navegação e áreas de ação responsivas |

## Etapa 4 — Mercado

| Área | Aplicação entregue |
| --- | --- |
| `/vagas` | busca por texto, área, localidade, modalidade, contrato e senioridade; filtros removíveis, resultado, carregamento, erro, vazio e paginação |
| `/vagas/[id]` | contexto da organização, detalhes, faixa, acessibilidade, revisão da candidatura e denúncia confidencial |
| candidaturas da pessoa candidata | status nomeado, próximo passo, histórico, currículo preservado, cancelamento confirmado e denúncia |
| gestão da pessoa contratante | formulário por seções, ajuda contextual, revisão antes do envio, estados, transições permitidas e candidaturas recebidas |
| moderação de vagas | filtro de fila, contexto da vaga, motivo associado à decisão e retorno de sucesso ou erro |

Nenhum contrato de busca, autorização, visibilidade, transição ou moderação foi transferido para o
frontend: a API continua sendo a autoridade. A ordenação pública permanece a estável por publicação
e ID definida pelo backend; a interface a comunica como “mais recentes primeiro”, sem introduzir um
contrato de ordenação novo.

## Etapa 5 — Governança

| Área | Aplicação entregue |
| --- | --- |
| `/app/equipe` | painel curto para filas de moderação e denúncias, com orientação de escopo e acesso rápido ao contexto de trabalho |
| denúncias | criação confidencial, acompanhamento sem reexpor o relato, filtro por estado, status textual e paginação |
| fila de denúncias | filtros por estado, prioridade e recurso; detalhe autorizado; histórico com autoria, data e motivo; confirmação contextual de ações sensíveis |
| `/admin` e `/admin/usuarios` | moldura administrativa comum, busca, filtros, tabela com cabeçalhos no desktop, cartões utilizáveis no celular e confirmação para mudanças de papel ou estado |
| `/admin/auditoria` | consulta explícita por ação, autor, titular e período; paginação; detalhe dos metadados permitidos, sem apresentar os campos vedados pelo contrato |
| privacidade operacional | o centro de privacidade já informa controles disponíveis, indisponíveis e canal assistido sem prometer prazo ou operação inexistente |

A paginação reutilizável preserva o recorte em denúncias, fila de moderação, usuários e auditoria. As
confirmações informam o objeto, a consequência e a possibilidade de reversão antes de enviar a ação.
Nenhum bloqueio de permissão foi transferido para a interface: a moldura de sessão melhora a
orientação e a API mantém a decisão final.

## Limites conhecidos

- testes E2E de navegador, auditoria de leitor de tela, contraste e regressão visual continuam
  pendentes antes de um piloto público;
- a auditoria manual ainda deve cobrir 320 px, 768 px, 1280 px ou mais e zoom de 200%;
- o backend não expõe alternativas de ordenação pública; por isso a interface não oferece um seletor
  que sugeriria uma capacidade inexistente;
- o CSS legado continua no repositório para as rotas ainda não migradas e só deve ser removido após
  inventário de consumidores e regressão validada.

## Validações executadas

Em 2026-07-27:

| Validação | Resultado |
| --- | --- |
| typecheck do frontend | aprovado |
| lint do frontend | aprovado |
| testes do frontend | aprovado; 27 testes, incluindo 3 da jornada de governança |
| build de produção do frontend | aprovado |
| formatação dos arquivos alterados | aprovada; a checagem global permanece vermelha por cinco arquivos preexistentes e fora deste lote |

## Próximo marco

Executar a auditoria manual de responsividade, zoom, teclado e leitor de tela das filas e decisões de
governança, incluindo o fluxo de confirmação de papel, estado de conta e retirada de vaga da busca.
