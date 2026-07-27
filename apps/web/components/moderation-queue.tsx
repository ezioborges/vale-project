'use client';

import type {
  JobModerationDecision,
  JobStatus,
  ManagedJob,
} from '@vale/shared';
import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError, decideJob, listModerationJobs } from '@/lib/api';

import { JobMetadata, JobStatusBadge } from './market-status';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { FormField, Select, TextArea } from './ui/form-field';
import { PageHeading } from './ui/page-heading';

const queueStatusLabels: Partial<Record<JobStatus, string>> = {
  pending_review: 'Pendentes',
  changes_requested: 'Ajustes solicitados',
  approved: 'Aprovadas',
  rejected: 'Rejeitadas',
};

type Feedback = {
  message: string;
  tone: 'danger' | 'success';
};

export function ModerationQueue() {
  const [status, setStatus] = useState<JobStatus>('pending_review');
  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setJobs((await listModerationJobs(status)).items);
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message:
          error instanceof ApiRequestError
            ? error.message
            : 'Não foi possível carregar a fila.',
      });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(job: ManagedJob, decision: JobModerationDecision) {
    const reason = reasons[job.id]?.trim();
    if (decision !== 'approve' && (!reason || reason.length < 10)) {
      setFeedback({
        tone: 'danger',
        message: 'Informe um motivo claro com pelo menos 10 caracteres.',
      });
      return;
    }

    setDecidingId(job.id);
    try {
      await decideJob(job.id, decision, reason);
      setFeedback({
        tone: 'success',
        message: 'Decisão registrada com sucesso.',
      });
      await load();
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message:
          error instanceof ApiRequestError
            ? error.message
            : 'A decisão não pôde ser registrada.',
      });
      await load();
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-vale-content">
      <PageHeading
        as="h1"
        description="Revise conteúdo, transparência salarial, acessibilidade e compromisso inclusivo antes de publicar. A API protege decisões concorrentes."
        eyebrow="Governança antes da publicação"
        title="Fila de moderação de vagas"
      />

      <Card className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <FormField
          className="w-full sm:max-w-72"
          id="moderation-status"
          label="Estado da fila"
        >
          <Select
            onChange={(event) => setStatus(event.target.value as JobStatus)}
            value={status}
          >
            {Object.entries(queueStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <p aria-live="polite" className="text-sm font-bold text-vale-muted">
          {jobs.length}{' '}
          {jobs.length === 1 ? 'item nesta página' : 'itens nesta página'}
        </p>
      </Card>

      {feedback ? (
        <Alert
          className="mt-6"
          title={
            feedback.tone === 'success'
              ? 'Decisão registrada'
              : 'Não foi possível concluir'
          }
          tone={feedback.tone}
        >
          {feedback.message}
        </Alert>
      ) : null}
      {loading ? (
        <div className="mt-8">
          <LoadingState label="Carregando fila" />
        </div>
      ) : null}
      {!loading && jobs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            description="Novos envios aparecerão em ordem de chegada."
            title="Fila limpa neste estado"
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6">
        {jobs.map((job) => (
          <Card className="grid gap-6 p-5 sm:p-7" key={job.id}>
            <div className="border-b border-vale-border pb-6">
              <JobStatusBadge status={job.status} />
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-vale-ink">
                {job.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-vale-muted">
                {job.employer.displayName} · {job.location}
              </p>
              <JobMetadata
                area={job.area}
                className="mt-4"
                contractType={job.contractType}
                seniority={job.seniority}
                workMode={job.workMode}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ModerationContent title="Descrição">
                {job.description}
              </ModerationContent>
              {job.requirements ? (
                <ModerationContent title="Requisitos">
                  {job.requirements}
                </ModerationContent>
              ) : null}
              <ModerationContent title="Transparência salarial">
                {job.salaryMin !== null && job.salaryMax !== null
                  ? `R$ ${job.salaryMin.toLocaleString('pt-BR')} – R$ ${job.salaryMax.toLocaleString('pt-BR')}`
                  : (job.salaryHiddenReason ?? 'Faixa não informada')}
              </ModerationContent>
              <ModerationContent title="Compromisso inclusivo">
                {job.inclusionCommitment
                  ? 'Confirmado pela organização.'
                  : 'Não foi confirmado pela organização.'}
              </ModerationContent>
              {job.accessibilityInfo ? (
                <ModerationContent title="Acessibilidade e adaptações">
                  {job.accessibilityInfo}
                </ModerationContent>
              ) : null}
            </div>

            {job.status === 'pending_review' ? (
              <section
                aria-labelledby={`decision-${job.id}`}
                className="grid gap-5 rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4 sm:p-5"
              >
                <div>
                  <h3
                    className="font-extrabold text-vale-ink"
                    id={`decision-${job.id}`}
                  >
                    Registrar decisão
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-vale-muted">
                    Aprovar publica a vaga. Solicitar ajuste ou rejeitar exige
                    um motivo objetivo para a organização.
                  </p>
                </div>
                <FormField
                  hint="Obrigatório para solicitar ajuste ou rejeitar; informe o trecho e a correção esperada."
                  id={`moderation-reason-${job.id}`}
                  label="Motivo da decisão"
                >
                  <TextArea
                    disabled={decidingId === job.id}
                    maxLength={1000}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [job.id]: event.target.value,
                      }))
                    }
                    placeholder="Seja objetivo, indique o trecho e a correção esperada."
                    rows={4}
                    value={reasons[job.id] ?? ''}
                  />
                </FormField>
                <div className="flex flex-wrap gap-3">
                  <Button
                    loading={decidingId === job.id}
                    loadingLabel="Registrando decisão"
                    onClick={() => void decide(job, 'approve')}
                  >
                    Aprovar
                  </Button>
                  <Button
                    disabled={decidingId === job.id}
                    onClick={() => void decide(job, 'request_changes')}
                    variant="secondary"
                  >
                    Solicitar ajustes
                  </Button>
                  <Button
                    disabled={decidingId === job.id}
                    onClick={() => void decide(job, 'reject')}
                    variant="danger"
                  >
                    Rejeitar
                  </Button>
                </div>
              </section>
            ) : null}

            {job.moderationReason ? (
              <Alert title="Motivo registrado" tone="warning">
                {job.moderationReason}
              </Alert>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

function ModerationContent({
  children,
  title,
}: {
  children: string;
  title: string;
}) {
  return (
    <section className="rounded-vale-md border border-vale-border bg-vale-surface p-4">
      <h3 className="text-sm font-extrabold text-vale-ink">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-vale-muted">
        {children}
      </p>
    </section>
  );
}
