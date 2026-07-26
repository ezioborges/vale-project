'use client';

import type { ApplicationStatus, CandidateApplication } from '@vale/shared';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  ApiRequestError,
  cancelApplication,
  listMyApplications,
} from '@/lib/api';
import { ReportControl } from '@/components/report-control';

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: 'Enviada',
  under_review: 'Em análise',
  shortlisted: 'Próxima etapa',
  rejected: 'Encerrada',
  cancelled: 'Cancelada',
};

export function CandidateApplications() {
  const [items, setItems] = useState<CandidateApplication[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      setItems((await listMyApplications(filter || undefined)).items);
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível carregar suas candidaturas.',
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(item: CandidateApplication) {
    if (
      !window.confirm(
        `Cancelar a candidatura para “${item.job.title}”? O contratante perderá o acesso relacional ao seu perfil.`,
      )
    ) {
      return;
    }
    setMessage('');
    try {
      await cancelApplication(item.id);
      setMessage('Candidatura cancelada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao cancelar.');
    }
  }

  return (
    <section className="management-page">
      <div className="management-hero">
        <span className="eyebrow">Minha jornada</span>
        <h1>Candidaturas</h1>
        <p>
          Acompanhe um histórico objetivo do processo. Seus dados continuam
          restritos à organização responsável por cada vaga.
        </p>
      </div>

      <div className="management-toolbar">
        <label>
          Filtrar por status
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as ApplicationStatus | '')
            }
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Link className="secondary-action" href="/vagas">
          Explorar vagas
        </Link>
      </div>

      {message && <p className="notice">{message}</p>}
      {loading && <div className="empty-state-card">Carregando processos…</div>}
      {!loading && items.length === 0 && (
        <div className="empty-state-card">
          <strong>Nenhuma candidatura por aqui.</strong>
          <span>
            Quando você se candidatar, o histórico aparecerá nesta área.
          </span>
        </div>
      )}

      <div className="application-list">
        {items.map((item) => (
          <article className="application-card" key={item.id}>
            <div className="application-card-heading">
              <div>
                <span className={`status-badge status-${item.status}`}>
                  {statusLabels[item.status]}
                </span>
                <h2>{item.job.title}</h2>
                <p>{item.job.employerName}</p>
              </div>
              <Link className="text-action" href={`/vagas/${item.job.id}`}>
                Ver vaga
              </Link>
            </div>
            <div className="application-resume">
              <strong>Currículo preservado</strong>
              <span>
                {item.resumeFileName ??
                  'Removido conforme a política de retenção'}
              </span>
            </div>
            <ol className="status-timeline">
              {item.history.map((entry) => (
                <li key={entry.id}>
                  <span>{statusLabels[entry.toStatus]}</span>
                  <time dateTime={entry.changedAt}>
                    {new Date(entry.changedAt).toLocaleString('pt-BR')}
                  </time>
                </li>
              ))}
            </ol>
            {['submitted', 'under_review', 'shortlisted'].includes(
              item.status,
            ) &&
              item.job.status === 'approved' && (
                <button
                  className="danger-action"
                  onClick={() => void cancel(item)}
                >
                  Cancelar candidatura
                </button>
              )}
            <ReportControl
              targetType="application"
              targetId={item.id}
              label="Denunciar algo neste processo"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
