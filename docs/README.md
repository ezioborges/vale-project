# Documentacao do Vale Project

Esta pasta concentra a documentacao inicial do produto, requisitos, arquitetura e qualidade.

O objetivo e manter os documentos pequenos, versionaveis e faceis de transformar em epicos, historias de usuario, criterios de aceite e tarefas tecnicas.

## Visão da proposta de interface

![Apresentação da proposta visual do Vale](assets/laboratorio-ui-apresentacao.png)

A implementação e a sequência de adoção estão descritas no
[plano de aplicação do design](planos-de-acao/12-plano-aplicacao-design.md).

## Ordem recomendada de leitura

| Ordem | Documento |
|---|---|
| 1 | [00-visao-geral.md](00-visao-geral.md) |
| 2 | [01-requisitos-funcionais.md](01-requisitos-funcionais.md) |
| 3 | [02-requisitos-nao-funcionais.md](02-requisitos-nao-funcionais.md) |
| 4 | [03-regras-de-negocio.md](03-regras-de-negocio.md) |
| 5 | [04-arquitetura.md](04-arquitetura.md) |
| 6 | [05-modelo-de-dados.md](05-modelo-de-dados.md) |
| 7 | [06-seguranca-e-lgpd.md](06-seguranca-e-lgpd.md) |
| 8 | [07-testes-e-qualidade.md](07-testes-e-qualidade.md) |
| 9 | [08-testes-manuais-interface.md](08-testes-manuais-interface.md) |
| 10 | [08-backlog-e-roadmap.md](08-backlog-e-roadmap.md) |
| 11 | [planos-de-acao/09-plano-de-acao-mvp.md](planos-de-acao/09-plano-de-acao-mvp.md) |
| 12 | [10-plano-de-estudos.md](10-plano-de-estudos.md) |
| 13 | [11-estudo-pnpm-workspaces.md](11-estudo-pnpm-workspaces.md) |
| 14 | [planos-de-acao/12-plano-aplicacao-design.md](planos-de-acao/12-plano-aplicacao-design.md) |
| 15 | [planos-de-acao/13-plano-melhorias-seguranca-fluxo.md](planos-de-acao/13-plano-melhorias-seguranca-fluxo.md) |
| 16 | [planos-de-acao/etapas/14-plano-acao-etapa-0.md](planos-de-acao/etapas/14-plano-acao-etapa-0.md) |
| 17 | [15-execucao-etapa-1.md](15-execucao-etapa-1.md) |
| 18 | [16-execucao-etapa-2.md](16-execucao-etapa-2.md) |
| 19 | [17-execucao-etapa-3.md](17-execucao-etapa-3.md) |
| 20 | [planos-de-acao/etapas/18-plano-execucao-etapa-4.md](planos-de-acao/etapas/18-plano-execucao-etapa-4.md) |
| 21 | [19-execucao-etapa-4.md](19-execucao-etapa-4.md) |
| 22 | [requirements/README.md](requirements/README.md) |
| 23 | [runbooks/README.md](runbooks/README.md) |

## Registros operacionais

| Diretório | Conteúdo |
| --- | --- |
| [requirements](requirements/README.md) | execução verificável, rastreabilidade e pendências por fase |
| [runbooks](runbooks/README.md) | setup local, ambientes, promoção e checklists operacionais |
| [adr](adr/0002-design-system-interface.md) | decisões arquiteturais e suas consequências |
| [planos-de-acao](planos-de-acao/README.md) | direcionamento do MVP, planos transversais e planos por etapa |

## Convencoes

| Prefixo | Significado |
|---|---|
| RF | Requisito funcional |
| RNF | Requisito nao funcional |
| RN | Regra de negocio |
| ADR | Architecture Decision Record |

Documentos de plano descrevem intenção. Registros em `requirements` descrevem somente o que foi
implementado e verificado. Runbooks devem conter comandos seguros e reproduzíveis, usando apenas
dados fictícios nos exemplos.
