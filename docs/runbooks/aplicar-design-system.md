# Runbook — aplicar o design system em uma nova tela

Este procedimento orienta a criação ou migração de telas do frontend para o padrão visual do Vale.
Ele não altera regras de autorização, privacidade ou validação da API.

## 1. Referências obrigatórias

Antes de implementar:

1. consulte `/laboratorio-ui` no ambiente local;
2. leia o [ADR da fundação visual](../adr/0002-design-system-interface.md);
3. identifique a fase funcional em `requirements/`;
4. confirme papel, permissão, dados sensíveis e ação principal da história.

## 2. Preparar o ambiente

Na raiz do repositório:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @vale/web dev
```

Acesse:

| Área | URL |
| --- | --- |
| Laboratório | `http://localhost:3000/laboratorio-ui` |
| Aplicação | `http://localhost:3000` |

## 3. Reutilizar antes de criar

Para cada elemento da tela:

1. procure um componente existente;
2. procure o padrão equivalente no laboratório;
3. use tokens do tema em vez de valores de cor soltos;
4. use um ícone Font Awesome já disponível;
5. crie variante somente quando comportamento ou semântica realmente mudarem.

Se um padrão aparecer em mais de uma tela, extraia-o para `apps/web/components`. Não importe
componentes de dentro da rota do laboratório para a aplicação.

## 4. Usar ícones

- importe apenas os ícones usados de `@fortawesome/free-solid-svg-icons`;
- renderize com `FontAwesomeIcon`;
- trate ícones decorativos como `aria-hidden`;
- em botão sem texto, forneça `aria-label` e `title`;
- não use emoji ou caractere Unicode como substituto inconsistente de ícone de interface.

## 5. Mapear estados antes de integrar

Registre os estados aplicáveis:

| Estado | Pergunta de validação |
| --- | --- |
| Inicial | a pessoa entende onde está e o que pode fazer? |
| Carregando | a estrutura permanece estável e informa progresso? |
| Vazio | explica a situação e oferece próximo passo real? |
| Erro de campo | aponta o campo e descreve como corrigir? |
| Erro geral | preserva dados seguros e permite tentar novamente? |
| Sucesso | confirma o resultado e informa o próximo passo? |
| Bloqueado | explica a condição sem revelar regra sensível? |
| Sem permissão | a API continua sendo a autoridade da decisão? |

## 6. Checklist de acessibilidade e conteúdo

- [ ] título da página e hierarquia de headings coerentes;
- [ ] região principal e navegação possuem nomes claros;
- [ ] todos os controles funcionam por teclado;
- [ ] foco visível não é removido nem encoberto;
- [ ] área interativa possui pelo menos 44 × 44 px quando aplicável;
- [ ] campo possui rótulo; placeholder não é o único rótulo;
- [ ] ajuda e erro estão associados ao campo;
- [ ] estado não depende só de cor ou posição;
- [ ] botão apenas com ícone possui nome acessível;
- [ ] texto não presume gênero, identidade ou trajetória;
- [ ] dado sensível é opcional e explica finalidade e visibilidade.

## 7. Validar

Na raiz:

```bash
corepack pnpm --filter @vale/web typecheck
corepack pnpm --filter @vale/web lint
corepack pnpm --filter @vale/web test
corepack pnpm --filter @vale/web build
```

Valide manualmente pelo menos:

- largura pequena a partir de 320 px;
- largura média próxima de 768 px;
- largura grande a partir de 1280 px;
- zoom de 200%;
- navegação apenas por teclado;
- carregamento, vazio, erro e sucesso aplicáveis.

## 8. Registrar a entrega

Atualize o arquivo da fase em `docs/requirements/` com:

- escopo realmente entregue;
- requisitos atendidos e parciais;
- comandos executados e resultados;
- limitações conhecidas;
- próximo marco.

Atualize o laboratório quando um componente aprovado mudar. Crie ou altere ADR somente para uma
decisão arquitetural relevante; atualize este runbook quando o procedimento mudar.

## Problemas comuns

### Utilitários Tailwind não aparecem

Confirme que o arquivo está dentro de `apps/web/app` ou `apps/web/components`, reinicie o servidor
local e verifique o processamento por `@tailwindcss/postcss`. Não substitua a falha por estilos
duplicados sem entender a causa.

### Ícone aparece sem estilo ou muda durante o carregamento

Confirme a importação global de `@fortawesome/fontawesome-svg-core/styles.css` e que
`config.autoAddCss` está desabilitado no layout raiz.

### Um token necessário não existe

Verifique se o valor representa uma função reutilizável. Se representar, adicione um token semântico,
atualize o laboratório e registre a consequência. Se for uma exceção local, documente por que não
deve virar padrão.

### A tela exige uma regra de permissão no frontend

Interrompa a implementação visual e confirme o contrato da API. O frontend pode ocultar ou
desabilitar ações para melhorar a experiência, mas não pode ser a única barreira de autorização.
