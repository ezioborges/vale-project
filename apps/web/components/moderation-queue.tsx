'use client';

import type {
  JobModerationDecision,
  JobStatus,
  ManagedJob,
} from '@vale/shared';
import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError, decideJob, listModerationJobs } from '@/lib/api';

const statusLabels: Partial<Record<JobStatus, string>> = {
  pending_review: 'Pendentes',
  changes_requested: 'Ajustes solicitados',
  approved: 'Aprovadas',
  rejected: 'Rejeitadas',
};

export function ModerationQueue() {
  const [status, setStatus] = useState<JobStatus>('pending_review');
  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      setJobs((await listModerationJobs(status)).items);
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível carregar a fila.',
      );
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
      setMessage('Informe um motivo claro com pelo menos 10 caracteres.');
      return;
    }
    setMessage('');
    try {
      await decideJob(job.id, decision, reason);
      setMessage('Decisão registrada com sucesso.');
      await load();
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'A decisão não pôde ser registrada.',
      );
      await load();
    }
  }

  return (
    <section className="management-page moderation-page">
      <div className="management-hero">
        <span className="eyebrow">Governança antes da publicação</span>
        <h1>Fila de moderação de vagas</h1>
        <p>
          Revise conteúdo, transparência salarial, acessibilidade e compromisso
          inclusivo. Decisões concorrentes são protegidas pela API.
        </p>
      </div>

      <div className="management-toolbar">
        <label>
          Estado da fila
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as JobStatus)}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <strong>{jobs.length} itens nesta página</strong>
      </div>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {loading && <div className="empty-state-card">Carregando fila…</div>}
      {!loading && jobs.length === 0 && (
        <div className="empty-state-card">
          <strong>Fila limpa neste estado.</strong>
          <span>Novos envios aparecerão em ordem de chegada.</span>
        </div>
      )}

      <div className="moderation-list">
        {jobs.map((job) => (
          <article className="moderation-card" key={job.id}>
            <div className="moderation-card-summary">
              <span className={`status-badge status-${job.status}`}>
                {statusLabels[job.status] ?? job.status}
              </span>
              <h2>{job.title}</h2>
              <p>
                {job.employer.displayName} · {job.area} · {job.location}
              </p>
              <div className="job-card-meta">
                <span>{job.workMode}</span>
                <span>{job.contractType}</span>
                <span>{job.seniority}</span>
              </div>
            </div>
            <div className="moderation-copy">
              <section>
                <h3>Descrição</h3>
                <p>{job.description}</p>
              </section>
              {job.requirements && (
                <section>
                  <h3>Requisitos</h3>
                  <p>{job.requirements}</p>
                </section>
              )}
              <section>
                <h3>Transparência salarial</h3>
                <p>
                  {job.salaryMin !== null && job.salaryMax !== null
                    ? `R$ ${job.salaryMin.toLocaleString('pt-BR')} – R$ ${job.salaryMax.toLocaleString('pt-BR')}`
                    : job.salaryHiddenReason}
                </p>
              </section>
              {job.accessibilityInfo && (
                <section>
                  <h3>Acessibilidade</h3>
                  <p>{job.accessibilityInfo}</p>
                </section>
              )}
            </div>

            {job.status === 'pending_review' && (
              <div className="moderation-actions">
                <label>
                  Motivo para ajuste ou rejeição
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={reasons[job.id] ?? ''}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [job.id]: event.target.value,
                      }))
                    }
                    placeholder="Seja objetivo, indique o trecho e a correção esperada."
                  />
                </label>
                <div className="inline-actions">
                  <button
                    className="primary-action"
                    onClick={() => void decide(job, 'approve')}
                  >
                    Aprovar
                  </button>
                  <button
                    className="secondary-action"
                    onClick={() => void decide(job, 'request_changes')}
                  >
                    Solicitar ajustes
                  </button>
                  <button
                    className="danger-action"
                    onClick={() => void decide(job, 'reject')}
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            )}
            {job.moderationReason && (
              <div className="moderation-reason">
                <strong>Motivo registrado</strong>
                <p>{job.moderationReason}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
