# Documentacao do Vale Project

Esta pasta concentra a documentacao inicial do produto, requisitos, arquitetura e qualidade.

O objetivo e manter os documentos pequenos, versionaveis e faceis de transformar em epicos, historias de usuario, criterios de aceite e tarefas tecnicas.

## Visão da proposta de interface

![Apresentação da proposta visual do Vale](assets/laboratorio-ui-apresentacao.png)

A implementação e a sequência de adoção estão descritas no
[plano de aplicação do design](12-plano-aplicacao-design.md).

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
| 9 | [08-backlog-e-roadmap.md](08-backlog-e-roadmap.md) |
| 10 | [09-plano-de-acao.md](09-plano-de-acao.md) |
| 11 | [10-plano-de-estudos.md](10-plano-de-estudos.md) |
| 12 | [11-estudo-pnpm-workspaces.md](11-estudo-pnpm-workspaces.md) |
| 13 | [12-plano-aplicacao-design.md](12-plano-aplicacao-design.md) |
| 14 | [requirements/README.md](requirements/README.md) |
| 15 | [runbooks/README.md](runbooks/README.md) |

## Registros operacionais

| Diretório | Conteúdo |
| --- | --- |
| [requirements](requirements/README.md) | execução verificável, rastreabilidade e pendências por fase |
| [runbooks](runbooks/README.md) | setup local, ambientes, promoção e checklists operacionais |
| [adr](adr/0002-design-system-interface.md) | decisões arquiteturais e suas consequências |

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
