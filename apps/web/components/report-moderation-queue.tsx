'use client';

import type {
  ModerationReport,
  ModerationReportPage,
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

import {
  reportPriorityLabels,
  reportReasonLabels,
  reportStatusLabels,
  reportTargetLabels,
  ReportPriorityBadge,
  ReportStatusBadge,
} from './governance-status';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog } from './ui/dialog';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { FormField, Select, TextArea } from './ui/form-field';
import { Pagination } from './ui/pagination';
import { PageHeading } from './ui/page-heading';

type Feedback = {
  message: string;
  tone: 'danger' | 'success';
};

type PendingDecision = {
  action: ReportDecisionAction;
  reason: string;
  report: ModerationReport;
};

const decisionLabels: Record<ReportDecisionAction, string> = {
  start_review: 'Iniciar análise',
  resolve: 'Resolver denúncia',
  dismiss: 'Encerrar sem ação',
  hide_job: 'Retirar vaga da busca',
  restore_job: 'Restaurar vaga na busca',
};

function failureMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError && error.status === 403) {
    return 'Esta sessão não pode acessar esta fila de moderação.';
  }

  return error instanceof Error ? error.message : fallback;
}

function decisionDescription({ action, report }: PendingDecision) {
  const target = `${reportTargetLabels[report.targetType].toLowerCase()} do protocolo ${report.id}`;

  switch (action) {
    case 'start_review':
      return `Você assumirá a análise da ${target}. A decisão e o motivo serão registrados no histórico.`;
    case 'resolve':
      return `Você concluirá a ${target}. A decisão ficará rastreável e só poderá ser complementada pelas transições permitidas pela API.`;
    case 'dismiss':
      return `Você encerrará a ${target} sem ação. A decisão, o motivo e a autoria ficarão registrados para consulta interna.`;
    case 'hide_job':
      return `Você retirará a vaga vinculada a ${target} da busca pública imediatamente. A API registrará a decisão; uma restauração exige nova ação explícita.`;
    case 'restore_job':
      return `Você restaurará a vaga vinculada a ${target} na busca pública. A mudança ficará registrada e a API continuará validando a transição.`;
  }
}

function canDecide(report: ModerationReport) {
  return (
    report.status !== 'dismissed' &&
    (report.status !== 'resolved' ||
      (report.targetType === 'job' &&
        report.decisions.some((decision) => decision.action === 'hide_job')))
  );
}

export function ReportModerationQueue() {
  const [result, setResult] = useState<ModerationReportPage | null>(null);
  const [status, setStatus] = useState<ReportStatus | ''>('open');
  const [priority, setPriority] = useState<ReportPriority | ''>('');
  const [targetType, setTargetType] = useState<ReportTargetType | ''>('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [priorityId, setPriorityId] = useState<string | null>(null);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] =
    useState<PendingDecision | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        setResult(
          await listModerationReports({
            page,
            priority: priority || undefined,
            status: status || undefined,
            targetType: targetType || undefined,
          }),
        );
      } catch (error) {
        setFeedback({
          message: failureMessage(error, 'Não foi possível carregar a fila.'),
          tone: 'danger',
        });
      } finally {
        setLoading(false);
      }
    },
    [priority, status, targetType],
  );

  useEffect(() => {
    setFeedback(null);
    void load();
  }, [load]);

  async function changePriority(
    report: ModerationReport,
    value: ReportPriority,
  ) {
    setPriorityId(report.id);
    try {
      await updateReportPriority(report.id, value);
      await load(result?.page ?? 1);
      setFeedback({ message: 'Prioridade atualizada.', tone: 'success' });
    } catch (error) {
      setFeedback({
        message: failureMessage(
          error,
          'Não foi possível atualizar a prioridade.',
        ),
        tone: 'danger',
      });
    } finally {
      setPriorityId(null);
    }
  }

  function prepareDecision(
    report: ModerationReport,
    action: ReportDecisionAction,
  ) {
    const reason = reasons[report.id]?.trim();
    if (!reason || reason.length < 10) {
      setFeedback({
        message:
          'Registre um motivo com pelo menos 10 caracteres antes de continuar.',
        tone: 'danger',
      });
      return;
    }

    setPendingDecision({ action, reason, report });
  }

  async function confirmDecision() {
    if (!pendingDecision) return;

    const { action, reason, report } = pendingDecision;
    setDecisionId(report.id);
    try {
      await decideReport(report.id, action, reason);
      setPendingDecision(null);
      await load(result?.page ?? 1);
      setFeedback({
        message: 'Decisão registrada e incluída na auditoria.',
        tone: 'success',
      });
    } catch (error) {
      setPendingDecision(null);
      setFeedback({
        message: failureMessage(error, 'Não foi possível registrar a decisão.'),
        tone: 'danger',
      });
      await load(result?.page ?? 1);
    } finally {
      setDecisionId(null);
    }
  }

  const reports = result?.items ?? [];

  return (
    <section className="mx-auto max-w-vale-content">
      <PageHeading
        as="h1"
        description="Analise somente o contexto necessário, priorize riscos e registre toda decisão com motivo. A retirada de uma vaga da busca exige confirmação explícita."
        eyebrow="Governança operacional"
        title="Fila de denúncias"
      />

      <Card className="mt-8 grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <FormField id="reports-status" label="Status">
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
        <FormField id="reports-priority" label="Prioridade">
          <Select
            onChange={(event) =>
              setPriority(event.target.value as ReportPriority | '')
            }
            value={priority}
          >
            <option value="">Todas as prioridades</option>
            {Object.entries(reportPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="reports-target-type" label="Recurso">
          <Select
            onChange={(event) =>
              setTargetType(event.target.value as ReportTargetType | '')
            }
            value={targetType}
          >
            <option value="">Todos os recursos</option>
            {Object.entries(reportTargetLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <p
          aria-live="polite"
          className="text-sm font-bold text-vale-muted sm:col-span-3"
        >
          {result ? `${result.total} relato(s) neste recorte` : 'Carregando'}
        </p>
      </Card>

      {feedback ? (
        <Alert
          className="mt-6"
          title={
            feedback.tone === 'success'
              ? 'Alteração registrada'
              : 'Não foi possível concluir'
          }
          tone={feedback.tone}
        >
          {feedback.message}
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-8">
          <LoadingState label="Carregando denúncias" />
        </div>
      ) : null}

      {!loading && reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            description="A fila é ordenada por prioridade e chegada. Altere os filtros para revisar outro recorte."
            title="Nenhum relato neste recorte"
          />
        </div>
      ) : null}

      {!loading && reports.length ? (
        <div className="mt-8 grid gap-6">
          {reports.map((report) => (
            <Card className="grid gap-6 p-5 sm:p-7" key={report.id}>
              <div className="grid gap-5 border-b border-vale-border pb-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <ReportPriorityBadge priority={report.priority} />
                    <ReportStatusBadge status={report.status} />
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-vale-ink">
                    {reportTargetLabels[report.targetType]} ·{' '}
                    {reportReasonLabels[report.reason]}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-vale-muted">
                    Relato de {report.reporter.displayName} · protocolo{' '}
                    <span className="break-all">{report.id}</span>
                  </p>
                </div>
                <FormField
                  id={`report-priority-${report.id}`}
                  label="Prioridade de triagem"
                >
                  <Select
                    disabled={
                      priorityId === report.id || decisionId === report.id
                    }
                    onChange={(event) =>
                      void changePriority(
                        report,
                        event.target.value as ReportPriority,
                      )
                    }
                    value={report.priority}
                  >
                    {Object.entries(reportPriorityLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </Select>
                </FormField>
              </div>

              <section
                aria-labelledby={`report-details-${report.id}`}
                className="rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4 sm:p-5"
              >
                <h3
                  className="font-extrabold text-vale-ink"
                  id={`report-details-${report.id}`}
                >
                  Relato e contexto autorizado
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-vale-ink">
                  {report.description}
                </p>
                <dl className="mt-5 grid gap-3 border-t border-vale-border pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-vale-muted">Recurso</dt>
                    <dd className="mt-1 break-all font-semibold text-vale-ink">
                      {report.targetId}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-vale-muted">Titular</dt>
                    <dd className="mt-1 break-all font-semibold text-vale-ink">
                      {report.targetUserId}
                    </dd>
                  </div>
                </dl>
              </section>

              {report.decisions.length ? (
                <section aria-labelledby={`report-history-${report.id}`}>
                  <h3
                    className="text-lg font-black tracking-[-0.03em] text-vale-ink"
                    id={`report-history-${report.id}`}
                  >
                    Histórico de decisões
                  </h3>
                  <ol className="mt-4 grid gap-3">
                    {report.decisions.map((decision) => (
                      <li
                        className="grid gap-3 rounded-vale-md border border-vale-border p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                        key={decision.id}
                      >
                        <div>
                          <p className="font-extrabold text-vale-ink">
                            {decisionLabels[decision.action]}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-vale-muted">
                            {decision.reason}
                          </p>
                          <p className="mt-3 break-all text-xs font-semibold text-vale-muted">
                            Responsável: {decision.actorUserId}
                          </p>
                        </div>
                        <time
                          className="text-sm font-semibold text-vale-muted"
                          dateTime={decision.createdAt}
                        >
                          {new Date(decision.createdAt).toLocaleString('pt-BR')}
                        </time>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {canDecide(report) ? (
                <section
                  aria-labelledby={`report-decision-${report.id}`}
                  className="grid gap-5 rounded-vale-md border border-vale-border bg-vale-surface p-4 sm:p-5"
                >
                  <div>
                    <h3
                      className="font-extrabold text-vale-ink"
                      id={`report-decision-${report.id}`}
                    >
                      Registrar decisão
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-vale-muted">
                      O motivo, a autoria, a data e a transição de estado serão
                      registrados. Não copie dados pessoais que não sejam
                      necessários para justificar a decisão.
                    </p>
                  </div>
                  <FormField
                    hint="Mínimo de 10 caracteres; descreva fatos e a medida tomada."
                    id={`report-reason-${report.id}`}
                    label="Motivo da decisão"
                    required
                  >
                    <TextArea
                      disabled={decisionId === report.id}
                      maxLength={1000}
                      minLength={10}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [report.id]: event.target.value,
                        }))
                      }
                      placeholder="Registre fatos e a ação tomada, sem copiar dados desnecessários."
                      required
                      rows={4}
                      value={reasons[report.id] ?? ''}
                    />
                  </FormField>
                  <div className="flex flex-wrap gap-3">
                    {report.status === 'open' ? (
                      <Button
                        disabled={decisionId === report.id}
                        onClick={() => prepareDecision(report, 'start_review')}
                        variant="secondary"
                      >
                        Iniciar análise
                      </Button>
                    ) : null}
                    {report.status !== 'resolved' ? (
                      <>
                        <Button
                          disabled={decisionId === report.id}
                          onClick={() => prepareDecision(report, 'resolve')}
                        >
                          Resolver
                        </Button>
                        <Button
                          disabled={decisionId === report.id}
                          onClick={() => prepareDecision(report, 'dismiss')}
                          variant="secondary"
                        >
                          Encerrar sem ação
                        </Button>
                        {report.targetType === 'job' ? (
                          <Button
                            disabled={decisionId === report.id}
                            onClick={() => prepareDecision(report, 'hide_job')}
                            variant="danger"
                          >
                            Retirar vaga da busca
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                    {report.status === 'resolved' &&
                    report.targetType === 'job' ? (
                      <Button
                        disabled={decisionId === report.id}
                        onClick={() => prepareDecision(report, 'restore_job')}
                        variant="secondary"
                      >
                        Restaurar vaga
                      </Button>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {result ? (
        <Pagination
          disabled={loading}
          label="Paginação da fila de denúncias"
          onPageChange={(page) => void load(page)}
          page={result.page}
          totalPages={result.totalPages}
        />
      ) : null}

      {pendingDecision ? (
        <Dialog
          confirmLabel={decisionLabels[pendingDecision.action]}
          confirmLoading={decisionId === pendingDecision.report.id}
          description={decisionDescription(pendingDecision)}
          onClose={() => setPendingDecision(null)}
          onConfirm={() => void confirmDecision()}
          open
          title={`${decisionLabels[pendingDecision.action]}?`}
          tone={pendingDecision.action === 'hide_job' ? 'danger' : 'default'}
        >
          <div className="rounded-vale-md bg-vale-neutral-subtle p-4 text-sm leading-6 text-vale-muted">
            <strong className="block text-vale-ink">Motivo registrado</strong>
            <p className="mt-2 whitespace-pre-line">{pendingDecision.reason}</p>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
