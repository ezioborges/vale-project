import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { CandidateApplications } from './candidate-applications';
import { EmployerJobManager } from './employer-job-manager';
import { JobDetail } from './job-detail';
import { JobsSearch } from './jobs-search';
import {
  ApplicationStatusBadge,
  JobMetadata,
  JobStatusBadge,
} from './market-status';
import { ModerationQueue } from './moderation-queue';

describe('jornada de mercado', () => {
  it('expõe filtros compreensíveis, estado de carregamento e resultado ordenado', () => {
    const markup = renderToStaticMarkup(<JobsSearch />);

    expect(markup).toContain('Buscar oportunidades');
    expect(markup).toContain('Modalidade');
    expect(markup).toContain('Vagas disponíveis');
    expect(markup).toContain('Carregando oportunidades');
  });

  it('usa estados textuais reutilizáveis para vaga e candidatura', () => {
    const markup = renderToStaticMarkup(
      <>
        <JobStatusBadge status="pending_review" />
        <ApplicationStatusBadge status="shortlisted" />
        <JobMetadata
          area="Tecnologia"
          contractType="clt"
          location="Remoto"
          seniority="mid"
          workMode="remote"
        />
      </>,
    );

    expect(markup).toContain('Em moderação');
    expect(markup).toContain('Próxima etapa');
    expect(markup).toContain('Características da oportunidade');
    expect(markup).toContain('Tecnologia');
  });

  it('mantém revisão e confirmação explícita nas ações sensíveis', () => {
    const candidateMarkup = renderToStaticMarkup(<CandidateApplications />);
    const employerMarkup = renderToStaticMarkup(<EmployerJobManager />);

    expect(candidateMarkup).toContain('Cancelar esta candidatura?');
    expect(candidateMarkup).toContain('acesso relacional');
    expect(employerMarkup).toContain('Revisar vaga');
    expect(employerMarkup).toContain('Encerrar esta vaga?');
    expect(employerMarkup).toContain('Justificativa para não informar a faixa');
  });

  it('preserva os pontos de entrada para candidatura e moderação', () => {
    const detailMarkup = renderToStaticMarkup(<JobDetail jobId="job-id" />);
    const moderationMarkup = renderToStaticMarkup(<ModerationQueue />);

    expect(detailMarkup).toContain('Carregando oportunidade');
    expect(moderationMarkup).toContain('Fila de moderação de vagas');
    expect(moderationMarkup).toContain('Estado da fila');
  });
});
