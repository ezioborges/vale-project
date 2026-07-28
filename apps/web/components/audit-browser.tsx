'use client';

import type { AuditEventPage } from '@vale/shared';
import { FormEvent, useState } from 'react';

import { ApiRequestError, listAuditEvents } from '@/lib/api';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { FormField, TextInput } from './ui/form-field';
import { Pagination } from './ui/pagination';
import { PageHeading } from './ui/page-heading';

type AuditFilters = {
  action?: string;
  actorUserId?: string;
  from?: string;
  targetUserId?: string;
  to?: string;
};

type Feedback = {
  message: string;
  tone: 'danger' | 'info';
};

function failureMessage(error: unknown) {
  if (error instanceof ApiRequestError && error.status === 403) {
    return 'Esta sessão não pode consultar a auditoria.';
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível consultar a auditoria.';
}

export function AuditBrowser() {
  const [result, setResult] = useState<AuditEventPage | null>(null);
  const [action, setAction] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeFilters, setActiveFilters] = useState<AuditFilters | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({
    message: 'Use filtros para consultar eventos de segurança e moderação.',
    tone: 'info',
  });

  async function load(filters: AuditFilters, page = 1) {
    setLoading(true);
    try {
      const nextResult = await listAuditEvents({ ...filters, page });
      setResult(nextResult);
      setFeedback({
        message: `${nextResult.total} evento(s) encontrado(s).`,
        tone: 'info',
      });
    } catch (error) {
      setFeedback({ message: failureMessage(error), tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (from && to && from > to) {
      setFeedback({
        message: 'A data inicial precisa ser anterior ou igual à data final.',
        tone: 'danger',
      });
      return;
    }

    const filters: AuditFilters = {
      action: action.trim() || undefined,
      actorUserId: actorUserId.trim() || undefined,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      targetUserId: targetUserId.trim() || undefined,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    };
    setResult(null);
    setActiveFilters(filters);
    void load(filters);
  }

  return (
    <section className="mx-auto max-w-vale-wide">
      <PageHeading
        as="h1"
        description="Consulte ações sensíveis por autor, titular, tipo e período. A resposta omite IP, user-agent, mensagens, currículos e conteúdo de denúncias."
        eyebrow="Rastreabilidade administrativa"
        title="Auditoria"
      />

      <form
        className="mt-8 grid gap-4 rounded-vale-lg border border-vale-border bg-vale-surface p-5 sm:grid-cols-2 lg:grid-cols-3 lg:p-6"
        onSubmit={search}
      >
        <FormField id="audit-action" label="Ação exata">
          <TextInput
            onChange={(event) => setAction(event.target.value)}
            placeholder="Ex.: report.decision_recorded"
            value={action}
          />
        </FormField>
        <FormField id="audit-actor" label="ID do autor">
          <TextInput
            onChange={(event) => setActorUserId(event.target.value)}
            placeholder="UUID"
            value={actorUserId}
          />
        </FormField>
        <FormField id="audit-target" label="ID do titular">
          <TextInput
            onChange={(event) => setTargetUserId(event.target.value)}
            placeholder="UUID"
            value={targetUserId}
          />
        </FormField>
        <FormField id="audit-from" label="Desde">
          <TextInput
            onChange={(event) => setFrom(event.target.value)}
            type="date"
            value={from}
          />
        </FormField>
        <FormField id="audit-to" label="Até">
          <TextInput
            onChange={(event) => setTo(event.target.value)}
            type="date"
            value={to}
          />
        </FormField>
        <div className="flex items-end">
          <Button
            fullWidth
            loading={loading}
            loadingLabel="Consultando auditoria"
            type="submit"
          >
            Consultar auditoria
          </Button>
        </div>
      </form>

      <Alert
        className="mt-6"
        title={
          feedback.tone === 'danger'
            ? 'Não foi possível consultar'
            : 'Consulta de auditoria'
        }
        tone={feedback.tone}
      >
        {feedback.message}
      </Alert>

      {loading ? (
        <div className="mt-8">
          <LoadingState label="Consultando eventos autorizados" />
        </div>
      ) : null}

      {!loading && activeFilters && result?.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            description="Altere os filtros ou o período para consultar outro recorte autorizado."
            title="Nenhum evento neste recorte"
          />
        </div>
      ) : null}

      {!loading && result?.items.length ? (
        <div className="mt-8 grid gap-4">
          {result.items.map((event) => (
            <Card className="grid gap-5 p-5 sm:p-6" key={event.id}>
              <div className="flex flex-col gap-3 border-b border-vale-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone="neutral">{event.action}</Badge>
                  <h2 className="mt-3 text-lg font-black tracking-[-0.03em] text-vale-ink">
                    Evento de auditoria
                  </h2>
                </div>
                <time
                  className="text-sm font-semibold text-vale-muted"
                  dateTime={event.createdAt}
                >
                  {new Date(event.createdAt).toLocaleString('pt-BR')}
                </time>
              </div>

              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-vale-muted">Autor</dt>
                  <dd className="mt-1 break-all font-semibold text-vale-ink">
                    {event.actorUserId}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-vale-muted">Titular</dt>
                  <dd className="mt-1 break-all font-semibold text-vale-ink">
                    {event.targetUserId}
                  </dd>
                </div>
              </dl>

              <details className="border-t border-vale-border pt-4">
                <summary className="cursor-pointer font-extrabold text-vale-action focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-vale-focus">
                  Ver metadados permitidos
                </summary>
                <pre className="mt-4 max-h-80 overflow-auto rounded-vale-md bg-vale-ink p-4 text-xs leading-5 text-white">
                  {JSON.stringify(event.context, null, 2)}
                </pre>
              </details>
            </Card>
          ))}
        </div>
      ) : null}

      {result && activeFilters ? (
        <Pagination
          disabled={loading}
          label="Paginação de eventos de auditoria"
          onPageChange={(page) => void load(activeFilters, page)}
          page={result.page}
          totalPages={result.totalPages}
        />
      ) : null}
    </section>
  );
}
