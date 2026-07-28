'use client';

import type { MyReportPage, ReportStatus } from '@vale/shared';
import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError, listMyReports } from '@/lib/api';

import {
  reportReasonLabels,
  reportStatusLabels,
  reportTargetLabels,
  ReportStatusBadge,
} from './governance-status';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { FormField, Select } from './ui/form-field';
import { Pagination } from './ui/pagination';
import { PageHeading } from './ui/page-heading';

function failureMessage(error: unknown) {
  if (error instanceof ApiRequestError && error.status === 403) {
    return 'Esta sessão não pode acessar o acompanhamento de denúncias.';
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar suas denúncias.';
}

export function MyReports() {
  const [result, setResult] = useState<MyReportPage | null>(null);
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setMessage('');
      try {
        setResult(
          await listMyReports({
            page,
            status: status || undefined,
          }),
        );
      } catch (error) {
        setMessage(failureMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const reports = result?.items ?? [];

  return (
    <section className="mx-auto max-w-vale-content">
      <PageHeading
        as="h1"
        description="Acompanhe o andamento sem reexpor o relato. A descrição, a prioridade e as notas internas ficam restritas à equipe de moderação."
        eyebrow="Canal de segurança"
        title="Minhas denúncias"
      />

      <Card className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <FormField
          className="w-full sm:max-w-72"
          id="my-reports-status"
          label="Filtrar por status"
        >
          <Select
            onChange={(event) =>
              setStatus(event.target.value as ReportStatus | '')
            }
            value={status}
          >
            <option value="">Todos os status</option>
            {Object.entries(reportStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <p aria-live="polite" className="text-sm font-bold text-vale-muted">
          {result ? `${result.total} protocolo(s) neste filtro` : 'Carregando'}
        </p>
      </Card>

      {message ? (
        <Alert className="mt-6" title="Não foi possível carregar" tone="danger">
          <p>{message}</p>
          <Button
            className="mt-4"
            onClick={() => void load()}
            variant="secondary"
          >
            Tentar novamente
          </Button>
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-8">
          <LoadingState label="Carregando denúncias" />
        </div>
      ) : null}

      {!loading && !message && reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            description="Use o controle de denúncia no recurso que precisa de análise ou escolha outro status."
            title="Nenhuma denúncia neste filtro"
          />
        </div>
      ) : null}

      {!loading && reports.length ? (
        <div className="mt-8 grid gap-4">
          {reports.map((report) => (
            <Card className="grid gap-4 p-5 sm:p-6" key={report.id}>
              <div className="flex flex-col gap-3 border-b border-vale-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <ReportStatusBadge status={report.status} />
                  <h2 className="mt-3 text-xl font-black tracking-[-0.03em] text-vale-ink">
                    {reportReasonLabels[report.reason]} em{' '}
                    {reportTargetLabels[report.targetType]}
                  </h2>
                </div>
                <time
                  className="text-sm font-semibold text-vale-muted"
                  dateTime={report.updatedAt}
                >
                  Atualizada em{' '}
                  {new Date(report.updatedAt).toLocaleString('pt-BR')}
                </time>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-vale-muted">Protocolo</dt>
                  <dd className="mt-1 break-all font-extrabold text-vale-ink">
                    {report.id}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-vale-muted">Registrada em</dt>
                  <dd className="mt-1 font-semibold text-vale-ink">
                    {new Date(report.createdAt).toLocaleString('pt-BR')}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      ) : null}

      {result ? (
        <Pagination
          disabled={loading}
          label="Paginação de denúncias"
          onPageChange={(page) => void load(page)}
          page={result.page}
          totalPages={result.totalPages}
        />
      ) : null}
    </section>
  );
}
