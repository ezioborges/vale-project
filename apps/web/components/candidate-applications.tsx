'use client';

import { faFileLines, faTimeline } from '@fortawesome/free-solid-svg-icons';
import type { ApplicationStatus, CandidateApplication } from '@vale/shared';
import { useCallback, useEffect, useState } from 'react';

import {
  ApiRequestError,
  cancelApplication,
  listMyApplications,
} from '@/lib/api';
import { ReportControl } from '@/components/report-control';

import {
  applicationStatusGuidance,
  ApplicationStatusBadge,
} from './market-status';
import { ActionLink, Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog } from './ui/dialog';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import { FormField, Select } from './ui/form-field';
import { Icon } from './ui/icon';
import { PageHeading } from './ui/page-heading';

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: 'Enviada',
  under_review: 'Em análise',
  shortlisted: 'Próxima etapa',
  rejected: 'Encerrada',
  cancelled: 'Cancelada',
};

type Feedback = {
  message: string;
  tone: 'danger' | 'success';
};

export function CandidateApplications() {
  const [items, setItems] = useState<CandidateApplication[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingCancellation, setPendingCancellation] =
    useState<CandidateApplication | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(
    async (clearFeedback = true) => {
      setLoading(true);
      if (clearFeedback) setFeedback(null);
      try {
        setItems((await listMyApplications(filter || undefined)).items);
      } catch (error) {
        setFeedback({
          tone: 'danger',
          message:
            error instanceof ApiRequestError
              ? error.message
              : 'Não foi possível carregar suas candidaturas.',
        });
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel() {
    if (!pendingCancellation) return;

    setCancelling(true);
    try {
      await cancelApplication(pendingCancellation.id);
      setPendingCancellation(null);
      await load(false);
      setFeedback({ tone: 'success', message: 'Candidatura cancelada.' });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Falha ao cancelar.',
      });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="mx-auto max-w-vale-content">
      <PageHeading
        as="h1"
        description="Acompanhe cada etapa do processo. Seus dados continuam restritos à organização responsável por cada vaga."
        eyebrow="Minha jornada"
        title="Candidaturas"
      />

      <Card className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <FormField
          className="w-full sm:max-w-72"
          id="application-status"
          label="Filtrar por status"
        >
          <Select
            onChange={(event) =>
              setFilter(event.target.value as ApplicationStatus | '')
            }
            value={filter}
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <ActionLink href="/vagas" variant="secondary">
          Explorar vagas
        </ActionLink>
      </Card>

      {feedback ? (
        <Alert
          className="mt-6"
          title={
            feedback.tone === 'success'
              ? 'Alteração confirmada'
              : 'Não foi possível atualizar'
          }
          tone={feedback.tone}
        >
          {feedback.message}
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-8">
          <LoadingState label="Carregando processos" />
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={<ActionLink href="/vagas">Explorar vagas</ActionLink>}
            description="Quando você se candidatar, o histórico e o próximo passo aparecerão nesta área."
            icon={<Icon icon={faTimeline} />}
            title="Nenhuma candidatura por aqui"
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-5">
        {items.map((item) => (
          <Card className="grid gap-6 p-5 sm:p-6" key={item.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <ApplicationStatusBadge status={item.status} />
                <h2 className="mt-3 text-xl font-black tracking-[-0.03em] text-vale-ink sm:text-2xl">
                  {item.job.title}
                </h2>
                <p className="mt-1 text-sm font-semibold text-vale-muted">
                  {item.job.employerName}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-vale-muted">
                  {applicationStatusGuidance[item.status]}
                </p>
              </div>
              <ActionLink
                href={`/vagas/${item.job.id}`}
                size="sm"
                variant="secondary"
              >
                Ver vaga
              </ActionLink>
            </div>

            <dl className="grid gap-3 rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4 sm:grid-cols-[minmax(11rem,0.35fr)_1fr]">
              <dt className="flex items-center gap-2 text-sm font-extrabold text-vale-ink">
                <Icon icon={faFileLines} />
                Currículo preservado
              </dt>
              <dd className="break-words text-sm leading-6 text-vale-muted">
                {item.resumeFileName ??
                  'Removido conforme a política de retenção'}
              </dd>
            </dl>

            <section aria-labelledby={`history-${item.id}`}>
              <h3
                className="text-sm font-extrabold text-vale-ink"
                id={`history-${item.id}`}
              >
                Histórico do processo
              </h3>
              <ol className="relative mt-4 grid gap-5 border-l-2 border-vale-border pl-5">
                {item.history.map((entry) => (
                  <li className="relative grid gap-1" key={entry.id}>
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.85rem] top-1 size-3 rounded-full border-2 border-vale-surface bg-vale-action"
                    />
                    <span className="text-sm font-extrabold text-vale-ink">
                      {statusLabels[entry.toStatus]}
                    </span>
                    <time
                      className="text-sm text-vale-muted"
                      dateTime={entry.changedAt}
                    >
                      {new Date(entry.changedAt).toLocaleString('pt-BR')}
                    </time>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-vale-border pt-5">
              {['submitted', 'under_review', 'shortlisted'].includes(
                item.status,
              ) && item.job.status === 'approved' ? (
                <Button
                  onClick={() => setPendingCancellation(item)}
                  variant="danger"
                >
                  Cancelar candidatura
                </Button>
              ) : null}
              <ReportControl
                label="Denunciar algo neste processo"
                targetId={item.id}
                targetType="application"
              />
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        confirmLabel="Cancelar candidatura"
        confirmLoading={cancelling}
        description={
          pendingCancellation
            ? `Você deixará de participar de “${pendingCancellation.job.title}”.`
            : undefined
        }
        onClose={() => setPendingCancellation(null)}
        onConfirm={() => void cancel()}
        open={Boolean(pendingCancellation)}
        title="Cancelar esta candidatura?"
        tone="danger"
      >
        <p className="text-sm leading-6 text-vale-muted">
          A organização perderá o acesso relacional ao seu perfil e ao currículo
          preservado neste processo. Esta ação não pode ser desfeita.
        </p>
      </Dialog>
    </section>
  );
}
