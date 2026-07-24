# Checklist de segurança para mudanças

Use os itens aplicáveis no pull request. Mudanças em autenticação, autorização, dados pessoais,
migrations ou logs devem incluir evidências positivas e negativas.

## Identidade e sessão

- [ ] senha é tratada apenas como entrada e armazenada com Argon2;
- [ ] access token permanece curto e refresh token não é persistido em texto puro;
- [ ] rotação revoga o refresh token anterior e retry não cria sessão ambígua;
- [ ] logout e suspensão invalidam as ações que o fluxo promete bloquear;
- [ ] tokens de verificação e recuperação são de uso único, expiram e não aparecem em logs;
- [ ] cookies de produção são HttpOnly, `Secure`, têm `SameSite` e escopo mínimo;
- [ ] login, cadastro, recuperação e reenvio possuem rate limiting adequado.

## Autorização

- [ ] toda operação protegida exige autenticação no backend;
- [ ] papel e propriedade do recurso são verificados no backend, não apenas na interface;
- [ ] há teste negativo para cada papel que não deve executar a ação;
- [ ] alteração de papel ou status registra ator, alvo, motivo, data e resultado;
- [ ] contas suspensas, desabilitadas ou excluídas não recuperam acesso por refresh;
- [ ] nenhuma rota pública permite escolher papel interno.

## Dados, consentimento e LGPD

- [ ] cada dado pessoal possui finalidade e visibilidade definidas;
- [ ] dado sensível é opcional, minimizado e protegido por consentimento explícito quando aplicável;
- [ ] aceite registra documento, versão, usuário e data sem metadata excessiva;
- [ ] logs e erros não contêm senha, token, currículo ou dado sensível desnecessário;
- [ ] exportação, correção, exclusão e retenção foram avaliadas para a entidade alterada;
- [ ] respostas da API não expõem colunas internas por serialização acidental.

## API e frontend

- [ ] DTOs rejeitam campos desconhecidos e validam formato, tamanho e enum;
- [ ] CORS permite apenas a origem necessária e credenciais somente quando exigidas;
- [ ] headers de segurança estão configurados no ambiente publicado;
- [ ] erro público não revela stack, query, segredo ou existência indevida de conta;
- [ ] conteúdo rico é sanitizado ou recusado;
- [ ] middleware e componentes frontend são tratados como UX, não como fronteira de segurança.

## Banco e operação

- [ ] a mudança usa migration versionada e mantém `synchronize: false`;
- [ ] migration foi testada desde uma base vazia e sobre o estado anterior suportado;
- [ ] mudança destrutiva possui backup, retorno e aprovação explícita;
- [ ] índices e constraints preservam invariantes também sob concorrência;
- [ ] credenciais são exclusivas por ambiente e ficam no cofre apropriado;
- [ ] seed usa apenas identidades fictícias e permanece desabilitado em produção;
- [ ] a revisão passou por `format:check`, lint, typecheck, testes e build.
