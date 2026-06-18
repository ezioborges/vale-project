# Backlog e Roadmap

## Epicos do MVP

| ID | Epico | Resultado esperado |
|---|---|---|
| EP-01 | Autenticacao e RBAC | Usuarios autenticam e acessam apenas recursos permitidos. |
| EP-02 | Onboarding por papel | Contratantes e candidatos seguem fluxos distintos desde o cadastro. |
| EP-03 | Perfil do candidato | Candidatos criam perfil profissional e controlam visibilidade. |
| EP-04 | Perfil do contratante | Contratantes criam perfil institucional e ficam aptos a publicar vagas. |
| EP-05 | Gestao de vagas | Contratantes criam, editam, pausam e encerram vagas. |
| EP-06 | Busca e candidatura | Candidatos encontram vagas e se candidatam com seguranca. |
| EP-07 | Moderacao e denuncias | Coordenadores analisam vagas, denuncias e conteudos inadequados. |
| EP-08 | Administracao e auditoria | Admin gerencia usuarios, papeis e eventos sensiveis. |
| EP-09 | Seguranca e LGPD | Plataforma protege dados e registra consentimentos. |
| EP-10 | Qualidade e observabilidade | Testes, logs, health checks e CI inicial. |

## Historias candidatas

| ID | Historia |
|---|---|
| US-01 | Como visitante, quero escolher se vou me cadastrar como contratante ou candidato para receber o fluxo correto. |
| US-02 | Como candidato, quero criar minha conta com nome social e dados profissionais para montar meu perfil. |
| US-03 | Como candidato, quero controlar a visibilidade do meu curriculo para proteger minha privacidade. |
| US-04 | Como contratante, quero cadastrar minha organizacao para publicar vagas inclusivas. |
| US-05 | Como contratante, quero criar uma vaga com requisitos, beneficios e modalidade para atrair candidatos. |
| US-06 | Como coordenador, quero revisar vagas pendentes para impedir conteudo inadequado. |
| US-07 | Como candidato, quero buscar vagas por filtros para encontrar oportunidades alinhadas ao meu perfil. |
| US-08 | Como candidato, quero me candidatar a uma vaga para participar do processo seletivo. |
| US-09 | Como contratante, quero visualizar candidaturas recebidas para conduzir o processo. |
| US-10 | Como usuario, quero denunciar conteudo inadequado para manter a plataforma segura. |
| US-11 | Como coordenador, quero analisar denuncias com historico para tomar decisoes rastreaveis. |
| US-12 | Como admin, quero gerenciar usuarios e papeis para manter a governanca da plataforma. |

## Roadmap sugerido

### Fase 0: Fundacao

| Entrega | Descricao |
|---|---|
| Repositorio | Estrutura base, padroes, documentacao e convencoes. |
| Backend base | NestJS, TypeORM, PostgreSQL, config, health check e migrations. |
| Frontend base | Next.js, layout inicial, autenticacao client-side e design foundation. |
| CI inicial | Lint, testes e build. |

### Fase 1: Identidade e acesso

| Entrega | Descricao |
|---|---|
| Cadastro | Fluxos separados para contratante e candidato. |
| Login | Sessao segura com refresh token. |
| RBAC | Guards no backend e rotas protegidas no frontend. |
| Termos | Registro de aceite de termos e politica de privacidade. |

### Fase 2: Perfis

| Entrega | Descricao |
|---|---|
| Perfil de candidato | Curriculo, experiencias, habilidades e visibilidade. |
| Perfil de contratante | Dados institucionais e responsavel. |
| Uploads | Avatar, logo e curriculo com validacao. |

### Fase 3: Vagas e candidaturas

| Entrega | Descricao |
|---|---|
| Vagas | Criar, editar, pausar e encerrar. |
| Busca | Listagem com filtros e paginacao. |
| Candidatura | Envio, status e acompanhamento. |
| Gestao | Contratante visualiza candidatos da propria vaga. |

### Fase 4: Moderacao e administracao

| Entrega | Descricao |
|---|---|
| Moderacao de vagas | Aprovar, rejeitar e solicitar ajustes. |
| Denuncias | Criar, analisar e resolver denuncias. |
| Admin | Gerenciar usuarios, papeis e status. |
| Auditoria | Eventos sensiveis e trilha de decisoes. |

## Fora do MVP

| Item | Motivo |
|---|---|
| Chat em tempo real | Aumenta escopo e moderacao. |
| Matching com IA | Exige base de dados, criterios eticos e avaliacao cuidadosa. |
| Planos pagos | Pode ser adicionado apos validacao do produto. |
| Aplicativo mobile nativo | Next.js responsivo atende o primeiro ciclo. |
| Integracoes ATS complexas | Melhor apos estabilizar modelo de vagas e candidaturas. |
