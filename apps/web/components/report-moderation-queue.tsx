'use client';

import type {
  ModerationReport,
  ReportDecisionAction,
  ReportPriority,
  ReportStatus,
  ReportTargetType,
} from '@vale/shared';
import { useCallback, useEffect, useState } from 'react';

import {
  ApiRequestError,
  decideReport,
  listModerationReports,
  updateReportPriority,
} from '@/lib/api';

const statusLabels: Record<ReportStatus, string> = {
  open: 'Aberta',
  in_review: 'Em análise',
  resolved: 'Resolvida',
  dismissed: 'Dispensada',
};

const priorityLabels: Record<ReportPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const targetLabels: Record<ReportTargetType, string> = {
  job: 'Vaga',
  profile: 'Perfil',
  user: 'Usuário',
  application: 'Candidatura',
};

export function ReportModerationQueue() {
  const [items, setItems] = useState<ModerationReport[]>([]);
  const [status, setStatus] = useState<ReportStatus | ''>('open');
  const [priority, setPriority] = useState<ReportPriority | ''>('');
  const [targetType, setTargetType] = useState<ReportTargetType | ''>('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      setItems(
        (
          await listModerationReports({
            status: status || undefined,
            priority: priority || undefined,
            targetType: targetType || undefined,
          })
        ).items,
      );
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível carregar a fila.',
      );
    } finally {
      setLoading(false);
    }
  }, [priority, status, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changePriority(
    report: ModerationReport,
    value: ReportPriority,
  ) {
    try {
      await updateReportPriority(report.id, value);
      await load();
      setMessage('Prioridade atualizada.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Falha ao priorizar.',
      );
    }
  }

  async function decide(
    report: ModerationReport,
    action: ReportDecisionAction,
  ) {
    const reason = reasons[report.id]?.trim();
    if (!reason || reason.length < 10) {
      setMessage('Registre um motivo com pelo menos 10 caracteres.');
      return;
    }
    try {
      await decideReport(report.id, action, reason);
      await load();
      setMessage('Decisão registrada e auditada.');
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível registrar a decisão.',
      );
      await load();
    }
  }

  return (
    <section className="management-page report-moderation-page">
      <div className="management-hero">
        <span className="eyebrow">Governança operacional</span>
        <h1>Fila de denúncias</h1>
        <p>
          Analise o relato mínimo necessário, priorize riscos e registre toda
          decisão com motivo. Conteúdo de vaga pode ser retirado da busca
          imediatamente.
        </p>
      </div>

      <div className="report-filters">
        <label>
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ReportStatus | '')
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
        <label>
          Prioridade
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as ReportPriority | '')
            }
          >
            <option value="">Todas</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Recurso
          <select
            value={targetType}
            onChange={(event) =>
              setTargetType(event.target.value as ReportTargetType | '')
            }
          >
            <option value="">Todos</option>
            {Object.entries(targetLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message && <p className="notice">{message}</p>}
      {loading && <div className="empty-state-card">Carregando denúncias…</div>}
      {!loading && items.length === 0 && (
        <div className="empty-state-card">
          <strong>Nenhum relato neste recorte.</strong>
          <span>A fila é ordenada por prioridade e chegada.</span>
        </div>
      )}

      <div className="report-moderation-list">
        {items.map((report) => (
          <article className="report-review-card" key={report.id}>
            <div className="report-review-heading">
              <div>
                <span className={`priority-badge priority-${report.priority}`}>
                  {priorityLabels[report.priority]}
                </span>
                <span className={`status-badge status-report-${report.status}`}>
                  {statusLabels[report.status]}
                </span>
                <h2>
                  {targetLabels[report.targetType]} · {report.reason}
                </h2>
                <p>
                  Relato por {report.reporter.displayName} · protocolo{' '}
                  {report.id}
                </p>
              </div>
              <label>
                Prioridade
                <select
                  value={report.priority}
                  onChange={(event) =>
                    void changePriority(
                      report,
                      event.target.value as ReportPriority,
                    )
                  }
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="report-description">
              <strong>Relato</strong>
              <p>{report.description}</p>
              <small>
                Recurso {report.targetId} · titular {report.targetUserId}
              </small>
            </div>

            {report.decisions.length > 0 && (
              <ol className="decision-history">
                {report.decisions.map((decision) => (
                  <li key={decision.id}>
                    <strong>{decision.action}</strong>
                    <span>{decision.reason}</span>
                    <time dateTime={decision.createdAt}>
                      {new Date(decision.createdAt).toLocaleString('pt-BR')}
                    </time>
                  </li>
                ))}
              </ol>
            )}

            {report.status !== 'dismissed' &&
              (report.status !== 'resolved' ||
                (report.targetType === 'job' &&
                  report.decisions.some(
                    (decision) => decision.action === 'hide_job',
                  ))) && (
                <div className="moderation-actions">
                  <label>
                    Motivo da decisão
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={reasons[report.id] ?? ''}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [report.id]: event.target.value,
                        }))
                      }
                      placeholder="Registre fatos e a ação tomada, sem copiar dados desnecessários."
                    />
                  </label>
                  <div className="inline-actions">
                    {report.status === 'open' && (
                      <button
                        className="secondary-action"
                        onClick={() => void decide(report, 'start_review')}
                      >
                        Iniciar análise
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <>
                        <button
                          className="primary-action"
                          onClick={() => void decide(report, 'resolve')}
                        >
                          Resolver
                        </button>
                        <button
                          className="secondary-action"
                          onClick={() => void decide(report, 'dismiss')}
                        >
                          Dispensar
                        </button>
                        {report.targetType === 'job' && (
                          <button
                            className="danger-action"
                            onClick={() => void decide(report, 'hide_job')}
                          >
                            Retirar vaga da busca
                          </button>
                        )}
                      </>
                    )}
                    {report.status === 'resolved' &&
                      report.targetType === 'job' && (
                        <button
                          className="secondary-action"
                          onClick={() => void decide(report, 'restore_job')}
                        >
                          Restaurar vaga
                        </button>
                      )}
                  </div>
                </div>
              )}
          </article>
        ))}
      </div>
    </section>
  );
}
