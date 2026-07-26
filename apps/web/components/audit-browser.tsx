'use client';

import type { AuditEventRecord } from '@vale/shared';
import { FormEvent, useState } from 'react';

import { ApiRequestError, listAuditEvents } from '@/lib/api';

export function AuditBrowser() {
  const [items, setItems] = useState<AuditEventRecord[]>([]);
  const [action, setAction] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    'Use filtros para consultar eventos de segurança e moderação.',
  );

  async function search(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await listAuditEvents({
        action: action.trim() || undefined,
        actorUserId: actorUserId.trim() || undefined,
        targetUserId: targetUserId.trim() || undefined,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
      });
      setItems(result.items);
      setMessage(`${result.total} evento(s) encontrado(s).`);
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível consultar a auditoria.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="management-page audit-page">
      <div className="management-hero">
        <span className="eyebrow">Rastreabilidade administrativa</span>
        <h1>Auditoria</h1>
        <p>
          Consulte ações sensíveis por autor, titular, tipo e período. A
          resposta omite IP, user-agent, mensagens, currículos e conteúdo de
          denúncias.
        </p>
      </div>

      <form className="audit-filter-form" onSubmit={search}>
        <label>
          Ação exata
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="Ex.: report.decision_recorded"
          />
        </label>
        <label>
          ID do autor
          <input
            value={actorUserId}
            onChange={(event) => setActorUserId(event.target.value)}
            placeholder="UUID"
          />
        </label>
        <label>
          ID do titular
          <input
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
            placeholder="UUID"
          />
        </label>
        <label>
          Desde
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <button className="primary-action" disabled={loading}>
          {loading ? 'Consultando…' : 'Consultar auditoria'}
        </button>
      </form>

      {message && <p className="notice">{message}</p>}
      <div className="audit-list">
        {items.map((event) => (
          <article className="audit-card" key={event.id}>
            <div>
              <span className="audit-action">{event.action}</span>
              <time dateTime={event.createdAt}>
                {new Date(event.createdAt).toLocaleString('pt-BR')}
              </time>
            </div>
            <dl>
              <div>
                <dt>Autor</dt>
                <dd>{event.actorUserId}</dd>
              </div>
              <div>
                <dt>Titular</dt>
                <dd>{event.targetUserId}</dd>
              </div>
            </dl>
            <details>
              <summary>Metadados permitidos</summary>
              <pre>{JSON.stringify(event.context, null, 2)}</pre>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
