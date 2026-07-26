# Execução da Fase 2 — perfis e privacidade

- Data da verificação: 2026-07-26
- Plano de origem: [`../09-plano-de-acao.md`](../09-plano-de-acao.md)
- Estado: concluída

## Escopo entregue

### Perfis e experiência web

- `CandidateProfile` e `EmployerProfile` em relações 1:1 com `User`, sem duplicar credenciais;
- perfil de candidato com nome de exibição, pronomes opcionais, título, bio, localidade,
  preferências estruturadas, skills, experiências, formação e links profissionais;
- perfil institucional com tipo, responsável, contato, nome condicional da organização, segmento,
  localidade, descrição, site e estado de verificação somente leitura para o titular;
- alteração do tipo ou nome institucional revoga automaticamente uma verificação anterior e deixa
  evidência de auditoria para nova análise;
- experiências, formação, skills e preferências em JSONB estruturado e validado, conforme o corte do
  MVP;
- ativação e desativação reversível do perfil do candidato sem apagar sua trajetória;
- percentual de completude calculado no servidor, formulários responsivos e feedback de
  carregamento, validação, sucesso e erro.

### Privacidade e autorização por recurso

- `private` é o padrão de todo novo perfil de candidato;
- titular, admin e coordenador preservam o acesso necessário;
- `verified_employers` exige simultaneamente perfil ativo, consentimento do candidato e contratante
  marcado como verificado no banco;
- `applications_only` não libera nenhum acesso antecipado nesta fase; a concessão por candidatura
  própria será adicionada junto com `Application` na Fase 3;
- decisões são aplicadas pelo `ProfilesService`; esconder controles no frontend não é tratado como
  mecanismo de segurança;
- atualização de perfil, visibilidade, ativação e arquivo gera auditoria com nomes dos campos e
  metadados mínimos, sem copiar valores pessoais.

### Upload e storage

- `ProfileAsset` mantém metadados e uma única versão corrente por usuário/finalidade;
- candidato pode enviar apenas `avatar` e `resume`; contratante pode enviar apenas `logo`;
- imagens aceitam JPEG, PNG ou WebP válidos até 2 MB; currículo aceita PDF válido até 5 MB;
- a validação confere MIME e bytes mágicos, gera extensão própria, normaliza o nome apresentado e
  usa chave aleatória;
- o driver local grava com permissão restrita fora da árvore pública;
- o driver remoto implementa assinatura AWS v4 para S3, Cloudflare R2 e serviços compatíveis;
- produção recusa o driver local e qualquer configuração remota incompleta;
- download autenticado repete a autorização por recurso e usa `Cache-Control: private, no-store` e
  `X-Content-Type-Options: nosniff`.

## Contrato HTTP

| Método e rota | Papel/condição | Resultado |
| --- | --- | --- |
| `GET /profiles/me` | candidato ou contratante ativo | perfil próprio |
| `PATCH /profiles/candidate/me` | candidato, e-mail e termos atuais | cria ou atualiza perfil |
| `PATCH /profiles/candidate/me/visibility` | candidato | altera consentimento de acesso |
| `PATCH /profiles/candidate/me/activation` | candidato | ativa ou desativa perfil |
| `PATCH /profiles/employer/me` | contratante, e-mail e termos atuais | cria ou atualiza perfil |
| `GET /profiles/candidates/:id` | autenticado e autorizado por recurso | perfil completo permitido |
| `POST /profiles/files` | titular e finalidade compatível com papel | substitui arquivo corrente |
| `GET /profiles/files/:id` | titular, equipe ou contratante autorizado | download privado |
| `DELETE /profiles/files/:id` | titular | remove arquivo corrente |

## Rastreabilidade

| Requisito/regra | Estado | Evidência |
| --- | --- | --- |
| RF-11–15 | Atendido | perfil profissional estruturado, arquivos e visibilidade |
| RF-16–18 | Atendido | perfil institucional e regra condicional de organização |
| RF-20 | Atendido no corte | campo somente servidor; fluxo administrativo permanece na Fase 4 |
| RF-21–24 | Atendido | edição, ativação, uploads e auditoria mínima |
| RN-10–15 | Atendido | dados opcionais, padrão privado e autorização por recurso |
| RN-35–37 | Atendido no corte | eventos mínimos sem valores pessoais |
| RNF-05/09/10 | Atendido | DTOs, assinatura/tamanho/destino e RBAC no backend |
| RNF-11/12/15 | Atendido | minimização, campos opcionais e auditoria sem conteúdo sensível |
| RNF-21–25 | Atendido no fluxo | layout responsivo, labels, foco e explicações de finalidade |
| RNF-26–31 | Atendido | módulo `profiles`, migration, service e cliente web separados |

## Evidências automatizadas

A suíte de integração usa controllers NestJS, guards globais e PostgreSQL real para cobrir:

- criação dos dois tipos de perfil e o padrão `private`;
- validação do nome da organização conforme o tipo do contratante;
- RBAC negativo entre candidato e contratante;
- rejeição de finalidade de arquivo incompatível com o papel;
- rejeição de PDF disfarçado, upload válido, headers seguros e download do titular;
- bloqueio de contratante não verificado;
- acesso de contratante verificado somente em `verified_employers`;
- bloqueio explícito em `applications_only` até existir uma candidatura própria;
- retorno ao modo privado e preservação do acesso do titular;
- auditoria de campos e visibilidade sem copiar o conteúdo da bio.

Comandos reproduzíveis:

```bash
pnpm test
pnpm test:integration
pnpm typecheck
pnpm lint
pnpm build
```

## Decisões encerradas

1. O padrão de visibilidade é `private`.
2. `applications_only` usa deny-by-default até a Fase 3 conseguir provar a candidatura própria.
3. Verificação de contratante não é autoatribuível.
4. Alterar a identidade institucional revoga a verificação anterior.
5. Arquivos não possuem URL pública; a API é o ponto de autorização.
6. A versão corrente substitui o arquivo anterior e evita acumulação silenciosa.
7. Produção requer storage S3/R2 compatível.
8. Auditoria de perfil registra quais campos mudaram, não seus valores.

## Próximo marco

A Fase 3 pode criar vagas, busca e candidaturas usando estes perfis. Ao implementar
`Application`, deve ampliar exclusivamente a política `applications_only` para o contratante dono
da vaga associada, com testes positivos e negativos por recurso.
