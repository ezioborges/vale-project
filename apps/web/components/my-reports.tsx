'use client';

import type {
  MyReport,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@vale/shared';
import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError, listMyReports } from '@/lib/api';

const statusLabels: Record<ReportStatus, string> = {
  open: 'Recebida',
  in_review: 'Em análise',
  resolved: 'Resolvida',
  dismissed: 'Encerrada sem ação',
};

const reasonLabels: Record<ReportReason, string> = {
  discrimination: 'Discriminação',
  harassment: 'Assédio',
  fraud: 'Fraude',
  inappropriate_content: 'Conteúdo inadequado',
  privacy: 'Privacidade',
  spam: 'Spam',
  other: 'Outro',
};

const targetLabels: Record<ReportTargetType, string> = {
  job: 'Vaga',
  profile: 'Perfil',
  user: 'Usuário',
  application: 'Candidatura',
};

export function MyReports() {
  const [items, setItems] = useState<MyReport[]>([]);
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      setItems((await listMyReports(status || undefined)).items);
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível carregar suas denúncias.',
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="management-page">
      <div className="management-hero">
        <span className="eyebrow">Canal de segurança</span>
        <h1>Minhas denúncias</h1>
        <p>
          Acompanhe somente o andamento. O relato completo, a prioridade e as
          notas internas ficam restritos à equipe de moderação.
        </p>
      </div>
      <div className="management-toolbar">
        <label>
          Filtrar por status
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
        <strong>{items.length} registros</strong>
      </div>
      {message && <p className="notice">{message}</p>}
      {loading && <div className="empty-state-card">Carregando registros…</div>}
      {!loading && items.length === 0 && (
        <div className="empty-state-card">
          <strong>Nenhuma denúncia neste filtro.</strong>
          <span>
            Use o controle de denúncia no recurso que precisa de análise.
          </span>
        </div>
      )}
      <div className="report-list">
        {items.map((report) => (
          <article className="report-summary-card" key={report.id}>
            <span className={`status-badge status-report-${report.status}`}>
              {statusLabels[report.status]}
            </span>
            <h2>
              {reasonLabels[report.reason]} em {targetLabels[report.targetType]}
            </h2>
            <p>Protocolo {report.id}</p>
            <time dateTime={report.createdAt}>
              Registrada em {new Date(report.createdAt).toLocaleString('pt-BR')}
            </time>
          </article>
        ))}
      </div>
    </section>
  );
}
