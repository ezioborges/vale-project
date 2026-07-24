# Execução transversal — laboratório e fundação de interface

- Data da verificação: 2026-07-24
- Plano de origem:
  [`../12-plano-aplicacao-design.md`](../12-plano-aplicacao-design.md)
- Decisão arquitetural:
  [`../adr/0002-design-system-interface.md`](../adr/0002-design-system-interface.md)
- Estado: referência inicial implementada; extração de componentes e aplicação nas rotas funcionais
  permanecem pendentes

## Escopo entregue

- rota pública `/laboratorio-ui`;
- tema Tailwind com tokens semânticos do Vale;
- Font Awesome Free integrado ao frontend;
- exemplos responsivos de cor, tipografia, botões, campos, badges e iconografia;
- exemplo de cadastro alinhado à escolha entre pessoa candidata e contratante;
- exemplos de vaga, progresso de perfil, filtros, feedback e estado vazio;
- critérios visíveis de acessibilidade e plano de aplicação por fase;
- prancha visual em `docs/assets/laboratorio-ui-apresentacao.png`;
- ADR, plano de adoção e runbook de manutenção.

## Rastreabilidade

| Requisito | Estado | Evidência ou pendência |
| --- | --- | --- |
| UI-RF-01 — disponibilizar referência navegável | Atendido | rota `apps/web/app/laboratorio-ui/page.tsx` |
| UI-RF-02 — representar cadastro por papel | Atendido como exemplo | seletor de pessoa candidata e contratante; não envia dados |
| UI-RF-03 — representar contratação e serviços | Parcial | vaga, perfil e filtros existem; fluxo de serviço terá detalhamento na Fase 3 |
| UI-RF-04 — documentar plano de aplicação | Atendido | `docs/12-plano-aplicacao-design.md` |
| UI-RF-05 — disponibilizar apresentação visual | Atendido | imagem incorporada ao índice e ao plano de aplicação |
| UI-RNF-01 — usar Tailwind | Atendido | tema e utilitários processados pelo PostCSS |
| UI-RNF-02 — usar biblioteca de ícones | Atendido | Font Awesome Free |
| UI-RNF-03 — manter fundo claro e contraste | Atendido na referência | canvas claro, superfícies brancas e texto escuro |
| UI-RNF-04 — comunicar estado além da cor | Atendido na referência | texto e ícones acompanham feedbacks e badges |
| UI-RNF-05 — navegação por teclado e foco visível | Implementado; auditoria manual pendente | controles possuem foco explícito e semântica nativa |
| UI-RNF-06 — responsividade | Implementado; auditoria visual pendente | grades e navegação possuem variações por breakpoint |

## Limites conhecidos

- a rota é uma referência visual e seus formulários não integram a API;
- os componentes ainda estão locais na página e precisam ser extraídos conforme ganharem consumidores;
- as rotas existentes ainda não foram migradas para evitar misturar a entrega visual com mudanças
  funcionais da Fase 1;
- testes automatizados de acessibilidade e regressão visual ainda não fazem parte do pipeline;
- a linguagem e os consentimentos finais do cadastro dependem das decisões pendentes da Fase 1.

## Validações executadas

Em 2026-07-24:

| Validação | Resultado |
| --- | --- |
| typecheck do frontend | aprovado |
| lint do frontend | aprovado |
| testes do frontend | 2 testes aprovados |
| build de produção do frontend | aprovado; `/laboratorio-ui` gerada como rota estática |
| formatação dos arquivos alterados | aprovada |

Essas validações confirmam integração técnica e compilação. Auditoria visual em navegadores, zoom,
teclado e leitor de tela continua necessária antes de aplicar o padrão a um fluxo de produção.

## Próximo marco

Extrair os componentes fundamentais e aplicar o padrão no fluxo real de cadastro e login. A
conclusão exige responsividade, teclado, estados de API e testes automatizados proporcionais ao
risco de identidade e consentimento.
