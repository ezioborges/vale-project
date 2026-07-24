# Plano de aplicação do design do Vale

Este plano transforma o laboratório visual em um sistema reutilizável, alinhado à sequência do MVP e
às necessidades de segurança, privacidade, moderação e acessibilidade do Vale.

## Visão proposta

![Apresentação da proposta visual do Vale](assets/laboratorio-ui-apresentacao.png)

A prancha resume a direção do laboratório: superfícies claras, ação principal violeta, cores da
comunidade usadas como acentos e experiências consistentes para cadastro, oportunidades e perfil.

## Objetivo

Aplicar uma experiência consistente nos fluxos de cadastro, contratação e prestação de serviços sem
interromper as entregas funcionais previstas no [plano de ação do MVP](09-plano-de-acao.md).

A rota `/laboratorio-ui` é a referência visual inicial. Ela não deve ser copiada integralmente para
outras páginas: os padrões aprovados devem ser extraídos como componentes reutilizáveis.

## Princípios de aplicação

| Princípio | Regra prática |
| --- | --- |
| Clareza antes da decoração | cada tela deve ter uma ação principal inequívoca e hierarquia de leitura curta |
| Cor com função | violeta identifica ação; demais cores reforçam categorias ou estados, nunca comunicam sozinhas |
| Privacidade por padrão | campos sensíveis são opcionais, explicam finalidade e não bloqueiam oportunidades |
| Inclusão na linguagem | textos não presumem gênero, identidade, trajetória, família ou capacidade |
| Reuso antes da variação | uma nova solução visual exige verificar primeiro os componentes existentes |
| Acessibilidade verificável | teclado, foco, contraste, rótulos e estados entram na definição de pronto |
| Backend como autoridade | componentes melhoram a experiência, mas não substituem autorização ou validação da API |

## Sequência de adoção

### Etapa 1 — consolidar a fundação

Objetivo: transformar as decisões do laboratório em uma base estável.

| Entrega | Critério de aceite |
| --- | --- |
| Tokens semânticos | cores, tipografia, espaçamento, bordas, elevação e foco possuem nomes por função |
| Tailwind | utilitários gerados pelo pipeline oficial, sem CSS duplicado por página |
| Iconografia | Font Awesome com tamanho, alinhamento, rótulo acessível e uso consistentes |
| Componentes mínimos | botão, campo, seletor, checkbox, badge, alerta, card, vazio e carregamento |
| Conteúdo | guia curto para títulos, ajuda, validação, erro e linguagem inclusiva |

Marco: componentes mínimos renderizados na rota do laboratório e documentados no runbook.

### Etapa 2 — aplicar na identidade

Objetivo: migrar primeiro a Fase 1 do MVP, que já está em fechamento.

Ordem recomendada:

1. escolha entre pessoa candidata e contratante;
2. cadastro com nome, e-mail, senha e consentimentos definidos pelo produto;
3. login;
4. verificação de e-mail;
5. recuperação de senha;
6. destinos iniciais por papel e estado da conta.

Critérios de saída:

- fluxos funcionam em 320 px, 768 px e 1280 px ou mais;
- navegação completa por teclado;
- mensagens de API convertidas em orientações compreensíveis;
- estados de envio, sucesso e erro implementados;
- testes não dependem apenas de cor, texto de placeholder ou posição visual.

### Etapa 3 — aplicar em perfis e privacidade

Objetivo: usar o padrão na Fase 2 sem ampliar a coleta de dados.

| Fluxo | Cuidado obrigatório |
| --- | --- |
| Onboarding | dividir conteúdo em etapas curtas e permitir retomada |
| Perfil profissional | separar dado público, restrito e privado |
| Identidade e pronomes | opcionais, com finalidade explícita e opção de não informar |
| Currículo e anexos | informar formatos, limite, progresso, erro e remoção |
| Visibilidade | explicar em linguagem simples quem poderá acessar cada dado |

Marco: pessoa usuária entende a visibilidade do perfil antes de publicar qualquer informação.

### Etapa 4 — aplicar no mercado

Objetivo: cobrir a Fase 3 do MVP, do encontro à candidatura.

| Área | Componentes principais |
| --- | --- |
| Descoberta | busca, filtros, ordenação, card de vaga ou serviço, paginação e vazio |
| Detalhe | resumo, requisitos, organização, faixa, modalidade, denúncia e ação principal |
| Candidatura | revisão dos dados compartilhados, confirmação e acompanhamento de estado |
| Contratante | criação de vaga, rascunho, revisão, publicação e lista de candidaturas |

Marco: o caminho `buscar → compreender → candidatar-se → acompanhar` é concluído sem ambiguidade.

### Etapa 5 — aplicar em governança

Objetivo: cobrir moderação, denúncias, administração e auditoria.

- diferenciar alerta informativo, risco e ação irreversível;
- exigir confirmação contextual para ações destrutivas;
- exibir estado, responsável, data e motivo em decisões moderadas;
- manter dados restritos fora de cards, logs visuais e mensagens genéricas;
- testar permissão positiva e negativa por papel.

Marco: a interface torna decisões sensíveis rastreáveis sem expor dados desnecessários.

## Processo para cada nova tela

1. identificar a história, papel, permissão, dado sensível e ação principal;
2. mapear todos os estados: inicial, carregando, sucesso, vazio, erro, bloqueado e sem permissão;
3. montar a tela usando componentes existentes;
4. adicionar uma variante ao laboratório somente quando ela for reutilizável;
5. revisar conteúdo, privacidade e acessibilidade antes da revisão visual;
6. validar responsividade, teclado, contraste e integração com a API;
7. registrar a evidência no arquivo da fase em `requirements/`;
8. atualizar ADR ou runbook apenas quando uma decisão ou procedimento realmente mudar.

## Definição de pronto de interface

Uma tela só está pronta quando:

- usa tokens e componentes aprovados;
- possui título, ação principal e retorno de navegação claros;
- funciona sem mouse;
- tem foco visível e ordem de tabulação coerente;
- associa rótulos, ajuda e erros aos campos;
- não depende apenas de cor ou ícone;
- trata carregamento, vazio, erro, sucesso e indisponibilidade aplicáveis;
- respeita as permissões e visibilidades validadas pelo backend;
- foi verificada em tela pequena, média e grande;
- possui teste proporcional à criticidade do fluxo.

## Governança e manutenção

| Evento | Ação |
| --- | --- |
| Novo token | justificar a função e atualizar laboratório, ADR quando necessário e documentação |
| Novo componente | provar reuso em pelo menos dois contextos ou justificar exceção |
| Nova variante | documentar estado, acessibilidade e limites de uso |
| Mudança visual incompatível | migrar consumidores e registrar impacto |
| Exceção temporária | abrir pendência com responsável, motivo e data de revisão |

O laboratório deve acompanhar o código em produção. Exemplos obsoletos reduzem confiança e devem ser
removidos ou atualizados na mesma mudança que altera o componente real.
