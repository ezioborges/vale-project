# Testes manuais pela interface

Este documento é o roteiro de aceitação manual do Vale Project. Ele descreve como validar as
funcionalidades disponíveis no navegador, sem chamar a API diretamente durante a execução dos
casos. Os comandos de preparação servem somente para montar o ambiente e as contas de teste.

> Nota: a interface ainda exibe algumas marcas do nome interno `Primícias`; isso não altera o
> comportamento esperado dos testes.

## 1. Objetivo e critérios de execução

Execute o roteiro após uma versão nova e depois de alterações em autenticação, permissões, vagas,
candidaturas, privacidade ou moderação. Registre cada caso como `Passou`, `Falhou` ou `Bloqueado`,
com evidência, data, ambiente, navegador e conta utilizada. Nunca registre senhas, tokens,
currículos ou outros dados sensíveis.

Um caso passa quando a ação só é possível para o perfil autorizado, a interface exibe loading/erro/
sucesso de forma compreensível, a tela ou status seguinte é coerente e o resultado permanece após
recarregar.

## 2. Preparação

Na raiz do projeto:

```bash
cp .env.example .env
pnpm db:up
pnpm --filter @vale/api migration:run
pnpm dev
```

Acesse `http://localhost:3000` e confirme `http://localhost:3001/health`. Para massa limpa, use
somente em desenvolvimento o procedimento de [setup local](runbooks/setup-local.md) ou o
`db:reset:dev` descrito no [README](../README.md).

O reset cria estas contas, todas ativas, verificadas e com os documentos legais aceitos:

| Papel | Conta | Senha |
|---|---|---|
| Administração | `admin@local.vale.test` | `ValeDev2026!` |
| Coordenação | `coordinator@local.vale.test` | `ValeDev2026!` |
| Contratante | `employer@local.vale.test` | `ValeDev2026!` |
| Pessoa candidata | `candidate@local.vale.test` | `ValeDev2026!` |

Use contas novas para cadastro e contas separadas para isolamento entre papéis. Prefira janela
anônima ou perfil de navegador separado por papel. No local, o provedor de e-mail padrão é `log`;
confirme links de verificação e recuperação no log ou em um provedor de teste. Tokens não devem
entrar em tickets ou evidências.

Dados fictícios sugeridos: `Ana Teste`, `Empresa Teste Inclusiva`, e-mail com sufixo da data,
currículo PDF pequeno sem dados reais e uma vaga com descrição de pelo menos 50 caracteres.

## 3. Mapa de cobertura

| Área | Rota | Papel |
|---|---|---|
| Página inicial, login e cadastro | `/` | Público |
| Recuperação de senha | `/recuperar-senha` | Público |
| Confirmação de e-mail | `/onboarding/candidato` e `/onboarding/contratante` | Conta nova |
| Busca e detalhe de vagas | `/vagas` e `/vagas/<id>` | Público/candidata |
| Perfil profissional | `/app/candidato` | Candidata |
| Candidaturas e denúncias | `/app/candidato/candidaturas` e `/app/candidato/denuncias` | Candidata |
| Privacidade | `/app/conta/privacidade` | Conta autenticada |
| Perfil institucional | `/app/contratante` | Contratante |
| Vagas e candidaturas recebidas | `/app/contratante/vagas` | Contratante |
| Denúncias do contratante | `/app/contratante/denuncias` | Contratante |
| Moderação de vagas | `/app/equipe/moderacao` | Coordenação/Admin |
| Moderação de denúncias | `/app/equipe/denuncias` | Coordenação/Admin |
| Gestão de usuários | `/admin/usuarios` | Admin |
| Auditoria | `/admin/auditoria` | Admin |

## 4. Autenticação e onboarding

### T01 — Cadastro como candidata e contratante

1. Na página inicial, selecione `Criar conta`.
2. Teste os papéis `Pessoa candidata` e `Pessoa contratante` com contas novas.
3. Informe nome com 2+ caracteres, e-mail novo e senha com 12+ caracteres.
4. Marque termos de uso, política de privacidade e diretrizes de inclusão; confira as versões.
5. Clique em `Criar conta` e abra o link recebido no onboarding correspondente.
6. Clique em `Confirmar e-mail` e entre na conta.

Esperado: a conta fica bloqueada antes da confirmação, ativa depois dela e é direcionada à área
correta. O perfil candidato começa privado; o perfil contratante começa sem verificação.

### T02 — Validações do cadastro

Teste nome vazio/curto, e-mail inválido ou já usado, senha curta, cada checkbox obrigatório
desmarcado e envio duplo.

Esperado: o envio é impedido, o campo recebe mensagem específica, a senha não é exibida nem
registrada e não há contas duplicadas.

### T03 — Login, logout e sessão

1. Entre com cada conta de teste e confirme o redirecionamento por papel.
2. Teste e-mail inexistente, senha incorreta e `Mostrar senha`/`Ocultar senha`.
3. Faça logout e tente voltar por URL direta e pelo histórico a uma rota protegida.
4. Abra duas janelas com papéis diferentes e confirme que cookies e dados não se misturam.

Esperado: o erro não confirma se o e-mail existe; após logout a área protegida não fica acessível.

### T04 — Verificação, reenvio e recuperação

1. Cadastre uma conta e tente confirmar sem token, com token inválido e com token expirado.
2. Use `Reenviar e-mail`, repita durante o cooldown e depois dele; confirme usando só o link mais
   recente.
3. Em `Esqueci minha senha`, envie e-mails existente e inexistente.
4. Abra o link de recuperação, defina senha 12+, use-a no login, teste a antiga e tente reutilizar
   o link.

Esperado: mensagens não expõem conta ou token; o cooldown funciona; tokens são de uso único;
senha nova funciona e a antiga deixa de funcionar.

## 5. Perfil de candidata

### T05 — Criar, editar e validar perfil

1. Abra `/app/candidato` e preencha nome de exibição, pronomes, título, localidade,
   disponibilidade e bio.
2. Informe áreas, modalidades, contratos, habilidades, uma experiência atual, uma encerrada,
   formação e links válidos de LinkedIn/GitHub.
3. Salve, recarregue e confira percentual de conclusão e todos os dados.
4. Teste nome curto, URL inválida, data inválida, experiência encerrada sem data final, ano fora
   do limite, texto acima do limite e excesso de itens; depois remova campos opcionais.

Esperado: dados válidos persistem; dados inválidos apontam o campo e não são salvos; opcionais
podem ficar vazios; itens podem ser adicionados e removidos.

### T06 — Arquivos, visibilidade e ativação

1. Depois de salvar, envie avatar JPEG/PNG/WebP até 2 MB e currículo PDF.
2. Tente formato não suportado, arquivo acima do limite e currículo que não seja PDF.
3. Baixe e remova cada arquivo; recarregue e confirme o estado.
4. Alterne `Privado`, `Apenas candidaturas` e `Contratantes verificados`.
5. Desative o perfil e tente candidatar-se; reative e confirme que a regra de privacidade ficou
   preservada.

Esperado: arquivos são privados, downloads/remoção funcionam só para a própria conta, perfil
desativado não pode ser compartilhado e reativar não altera sua visibilidade.

## 6. Perfil de contratante

### T07 — Perfil institucional

1. Abra `/app/contratante` e teste `Empresa`, `Organização` e `Individual`.
2. Para empresa/organização, deixe o nome institucional vazio; para individual, deixe-o vazio.
3. Preencha responsável, e-mail, telefone, segmento, localidade, site e descrição; salve e recarregue.
4. Envie, baixe e remova logo JPEG/PNG/WebP até 2 MB.
5. Altere dados institucionais e confira a indicação de verificação.

Esperado: empresa/organização exigem nome; individual não; URL inválida é rejeitada; dados e logo
persistem; alteração de identidade reinicia verificação quando aplicável.

## 7. Busca e gestão de vagas

### T08 — Busca pública e detalhe

1. Sem login, abra `/vagas`; confirme somente vagas aprovadas e teste busca, área, localidade,
   modalidade, contrato e senioridade isoladamente e combinados.
2. Remova filtros e use `Limpar filtros`; valide total e paginação.
3. Abra uma vaga e confira salário/faixa ou justificativa, acessibilidade, responsabilidades,
   requisitos e benefícios.
4. Teste vaga pausada/encerrada/inexistente.

Esperado: resultados atualizam; vagas não aprovadas não aparecem; indisponibilidade exibe mensagem
amigável e retorno à busca.

### T09 — Criar e validar vaga

1. Em `/app/contratante/vagas`, informe título, área, descrição com 50+ caracteres, localidade,
   modalidade, contrato, senioridade e compromisso inclusivo.
2. Preencha opcionais e uma faixa salarial mínima/máxima; envie para revisão.
3. Teste descrição curta, campos obrigatórios vazios, compromisso desmarcado, só um salário,
   mínimo maior que máximo, faixa com justificativa e ausência de faixa sem justificativa.

Esperado: vaga válida entra em `Em moderação` e não aparece publicamente antes da aprovação;
vaga inválida mostra a regra e não é enviada.

### T10 — Ciclo de vida da vaga

Após T11, como contratante, valide:

| Estado | Ação | Esperado |
|---|---|---|
| Ajustes solicitados | `Editar` e reenviar | volta para moderação |
| Publicada | `Editar` | nova versão volta para moderação |
| Publicada | `Pausar` | deixa de receber candidaturas |
| Pausada | `Retomar` | retorna ao fluxo permitido |
| Publicada/pausada | `Encerrar` e confirmar | encerrada, sem novas candidaturas |
| Encerrada | `Republicar` | exige nova revisão |

Teste cancelar o diálogo de encerramento: o status não pode mudar.

## 8. Moderação de vagas

### T11 — Aprovação, ajustes e rejeição

1. Como coordenação, abra `/app/equipe/moderacao` e filtre `Em moderação`.
2. Revise descrição, requisitos, salário, compromisso inclusivo e acessibilidade.
3. Para vagas distintas, use `Aprovar` sem motivo, `Solicitar ajustes` com motivo e `Rejeitar`
   com motivo.
4. Recarregue a fila e confira cada status; tente as mesmas ações como candidata e contratante.

Esperado: aprovação publica; ajustes mostram retorno ao contratante; rejeição não publica; ajustes
e rejeição exigem motivo; só coordenação/admin decidem.

## 9. Candidaturas

### T12 — Enviar com compartilhamento explícito

1. Como candidata, tenha perfil, currículo e visibilidade privada.
2. Em vaga aprovada, clique `Revisar e candidatar-se` e confira o resumo do que será compartilhado.
3. Libere `Apenas candidaturas`, informe mensagem opcional e envie.
4. Recarregue a vaga e `/app/candidato/candidaturas`.

Esperado: status `Enviada`, currículo preservado como cópia privada e apenas dados relacionais
entregues ao contratante.

### T13 — Bloqueios, acompanhamento e cancelamento

Teste candidatura sem login, com contratante, perfil incompleto/inativo, sem currículo, privado,
vaga pausada/encerrada e duplicada.

Depois, como contratante, abra candidaturas e percorra `Iniciar análise` e `Próxima etapa`; rejeite
uma. Como candidata, filtre `Enviada`, `Em análise`, `Próxima etapa`, `Encerrada` e `Cancelada`,
confira histórico/currículo e cancele candidaturas em cada estado elegível, confirmando o diálogo.

Esperado: bloqueios não criam registro parcial; transições válidas aparecem no histórico;
cancelamento é confirmado, irreversível, revoga acesso relacional e oculta dados da candidatura.

## 10. Denúncias e governança

### T14 — Criar e acompanhar denúncia

Como candidata e contratante, denuncie vaga, perfil, candidatura ou usuário quando o controle
estiver disponível. Teste todos os motivos: discriminação, assédio/intimidação, fraude, conteúdo
inadequado, privacidade, spam e outro. Envie com descrição factual; teste descrição vazia.

Esperado: descrição é obrigatória; protocolo/status são confirmados; autor vê somente suas
denúncias e o necessário para acompanhá-las.

### T15 — Triar e decidir denúncia

1. Como coordenação, abra `/app/equipe/denuncias`, filtre status, prioridade e alvo.
2. Altere prioridade entre baixa, normal, alta e urgente.
3. Use `Iniciar análise`, `Resolver` e `Encerrar sem ação`, sempre com motivo.
4. Em denúncia de vaga, teste `Retirar vaga da busca` e depois `Restaurar vaga`, confirmando os
   diálogos.

Esperado: filtros/paginação funcionam; motivo e confirmação são obrigatórios; retirada remove da
busca pública; restauração é explícita e todas as decisões ficam no histórico.

## 11. Privacidade, administração e auditoria

### T16 — Central de privacidade

Como candidata e contratante, abra `/app/conta/privacidade`, confira resumo de tratamentos,
arquivos, candidaturas e controles disponíveis, use `Corrigir dados do perfil`, altere um dado e
recarregue. Teste erro de carregamento e `Tentar novamente`.

Esperado: não há dados de terceiros; correção leva ao perfil correto; controles indisponíveis são
explicados claramente.

### T17 — Gestão de usuários

Como admin, abra `/admin/usuarios`, pesquise por nome/e-mail, filtre papel/estado e use paginação.
Altere papel e estados ativa, suspensa e desativada, informando motivo e confirmando. Teste motivo
vazio e cancelamento do diálogo.

Esperado: motivo é obrigatório; tabela/badges atualizam; conta suspensa/desativada perde acesso;
cancelar não grava; somente admin consegue alterar.

### T18 — Autorização por papel

Em janelas separadas, tente as rotas do mapa com pessoa deslogada, candidata, contratante,
coordenação e admin, inclusive digitando URLs diretamente.

Esperado: público acessa somente páginas públicas; cada papel acessa apenas sua área; coordenação
não acessa usuários/auditoria; admin acessa áreas administrativas; nenhum papel vê dados de outro
usuário apenas alterando a URL.

### T19 — Auditoria

Como admin, abra `/admin/auditoria`, consulte sem filtros e filtre por ação, ator, alvo, data inicial
e final. Teste UUID inválido, intervalo invertido e paginação. Confirme eventos de cadastro,
login/logout, perfis, moderação, denúncias, alterações administrativas e candidatura. Como
coordenação, tente abrir a rota.

Esperado: filtros/paginação funcionam; entradas inválidas têm mensagem; eventos não expõem senha,
token, currículo ou payload sensível; coordenação recebe acesso negado.

## 12. Qualidade transversal

1. Recarregue durante/depois de operações e confirme ausência de duplicidade.
2. Simule erro de rede e resultado vazio; valide mensagem e retry.
3. Use Tab, Shift+Tab, Enter e Espaço; confirme foco visível, labels e diálogos sem mouse.
4. Teste mobile (390 × 844), zoom de 200%, acentos, emoji, espaços e textos longos.
5. Confirme que loading desabilita apenas a ação em andamento e que mensagens são anunciadas.
6. Faça logout/login com papéis diferentes e confirme isolamento de dados.

## 13. Regressão rápida e registro

Para uma rodada curta, execute T01, T03, T05, T07, T08, T09, T11, T12, T13, T14, T15, T16, T17
e T19. Não aprovar uma entrega com falha crítica em autenticação, autorização, publicação,
candidatura, privacidade ou auditoria.

```text
Data/hora:
Versão/commit:
Ambiente:
Navegador e viewport:
Executor:

Caso | Resultado | Evidência | Observação
T01  |          |           |
T02  |          |           |
...

Falhas críticas:
Bloqueios:
Reteste após correção:
Aprovado por:
```

