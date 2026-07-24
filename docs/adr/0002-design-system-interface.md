# ADR 0002: Fundação visual e sistema de interface

## Status

Aceita como referência inicial.

## Contexto

O Vale será um sistema de contratação e prestação de serviços voltado à aproximação da comunidade
LGBTQIAPN+ com o mercado de trabalho. A interface precisa comunicar acolhimento e orgulho sem
comprometer clareza, confiança, privacidade ou acessibilidade.

O frontend existente usa Next.js e CSS global. Sem uma decisão comum para tokens, componentes e
ícones, cada nova fase do MVP pode introduzir variações difíceis de manter e testar.

## Decisão

Adotar a seguinte fundação:

| Área | Decisão |
| --- | --- |
| Estilo | Tailwind CSS 4 com tokens semânticos definidos no tema |
| Superfícies | fundo muito claro, superfícies brancas e texto de alto contraste |
| Cor principal | violeta para ações e foco de marca |
| Cores de apoio | rosa, azul, verde, laranja e amarelo inspirados na comunidade, aplicados por função |
| Ícones | Font Awesome Free por componente React |
| Referência viva | rota pública `/laboratorio-ui` com fundações, componentes, fluxos e estados |
| Acessibilidade | WCAG 2.2 nível AA como referência mínima |
| Evolução | extrair componentes reutilizáveis antes de aplicar o padrão em todas as rotas |

O laboratório é uma vitrine de padrões. Regras de negócio, autorização e validação final continuam
no backend.

## Regras de uso

- cor não será a única forma de comunicar estado;
- ícones decorativos serão ocultados de tecnologias assistivas;
- botões apenas com ícone terão nome acessível e dica visual;
- campos terão rótulo explícito;
- dados de identidade sensível serão opcionais e acompanhados de finalidade;
- novos tokens receberão nomes semânticos, não nomes ligados a uma tela específica;
- o efeito de arco-íris será reservado a momentos de marca ou celebração, não à estrutura completa.

## Justificativa

| Escolha | Motivo |
| --- | --- |
| Tailwind | acelera composição responsiva e mantém decisões próximas ao componente |
| Tokens semânticos | permitem evoluir a marca sem procurar valores soltos em todas as telas |
| Font Awesome | oferece biblioteca consistente, acessível e com integração React |
| Fundo claro | favorece legibilidade, familiaridade e uso prolongado em fluxos de trabalho |
| Paleta contida | expressa a comunidade sem transformar cor decorativa em ruído |
| Laboratório navegável | torna decisões testáveis e reduz interpretação divergente entre telas |

## Alternativas consideradas

| Alternativa | Motivo para não adotar agora |
| --- | --- |
| Manter apenas CSS global | aumenta duplicação e não oferece vocabulário consistente para novas telas |
| Criar ícones próprios | adiciona manutenção e risco de inconsistência sem valor central para o MVP |
| Aplicar todas as cores em todos os componentes | reduz hierarquia e pode prejudicar contraste |
| Migrar todas as rotas de uma vez | aumenta risco funcional na fase de identidade ainda em fechamento |

## Consequências

### Positivas

- novas telas partem de uma linguagem comum;
- responsividade e estados de foco ficam mais previsíveis;
- componentes e decisões visuais podem ser revisados em uma única rota;
- o plano visual acompanha a sequência funcional do MVP.

### Custos e riscos

- Tailwind e Font Awesome adicionam dependências ao frontend;
- a rota pode ficar obsoleta se não for atualizada junto com componentes reais;
- exemplos locais na rota ainda precisam ser extraídos para uma biblioteca de componentes;
- a aplicação gradual manterá temporariamente páginas antigas e novas em estilos diferentes.

## Plano de transição

Seguir o [plano de aplicação do design](../12-plano-aplicacao-design.md), começando pelos componentes
fundamentais e pelos fluxos de identidade. O procedimento operacional está no
[runbook de aplicação do design system](../runbooks/aplicar-design-system.md).
