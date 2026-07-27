'use client';

import { faFileArrowDown, faUsers } from '@fortawesome/free-solid-svg-icons';
import {
  jobInputSchema,
  type ContractType,
  type JobInput,
  type JobSeniority,
  type ManagedJob,
  type ReceivedApplication,
  type WorkMode,
} from '@vale/shared';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
  ApiRequestError,
  createJob,
  downloadApplicationResume,
  listMyJobs,
  listReceivedApplications,
  transitionJob,
  updateApplicationStatus,
  updateJob,
} from '@/lib/api';

import {
  applicationStatusLabels,
  contractLabels,
  JobMetadata,
  jobStatusGuidance,
  JobStatusBadge,
  seniorityLabels,
  workModeLabels,
  ApplicationStatusBadge,
} from './market-status';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog } from './ui/dialog';
import { Alert, EmptyState, LoadingState } from './ui/feedback';
import {
  CheckboxField,
  FormField,
  Select,
  TextArea,
  TextInput,
} from './ui/form-field';
import { Icon } from './ui/icon';
import { PageHeading } from './ui/page-heading';

type JobFormState = {
  accessibilityInfo: string;
  area: string;
  benefits: string;
  contractType: ContractType;
  description: string;
  inclusionCommitment: boolean;
  location: string;
  requirements: string;
  responsibilities: string;
  salaryHiddenReason: string;
  salaryMax: string;
  salaryMin: string;
  seniority: JobSeniority;
  title: string;
  workMode: WorkMode;
};

type Feedback = {
  message: string;
  tone: 'danger' | 'success';
};

const emptyForm: JobFormState = {
  title: '',
  area: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  location: '',
  workMode: 'remote',
  contractType: 'clt',
  seniority: 'mid',
  salaryMin: '',
  salaryMax: '',
  salaryHiddenReason: 'Faixa em definição pela organização.',
  accessibilityInfo: '',
  inclusionCommitment: false,
};

export function EmployerJobManager() {
  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ReceivedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingJob, setPendingJob] = useState<JobInput | null>(null);
  const [reviewError, setReviewError] = useState('');
  const [pendingClose, setPendingClose] = useState<ManagedJob | null>(null);
  const [closing, setClosing] = useState(false);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      setJobs((await listMyJobs()).items);
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message:
          error instanceof ApiRequestError
            ? error.message
            : 'Não foi possível carregar suas vagas.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  function jobInput(): JobInput | null {
    const parsed = jobInputSchema.safeParse({
      title: form.title,
      area: form.area,
      description: form.description,
      responsibilities: form.responsibilities.trim() || null,
      requirements: form.requirements.trim() || null,
      benefits: form.benefits.trim() || null,
      location: form.location,
      workMode: form.workMode,
      contractType: form.contractType,
      seniority: form.seniority,
      salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
      salaryHiddenReason: form.salaryHiddenReason.trim() || null,
      accessibilityInfo: form.accessibilityInfo.trim() || null,
      inclusionCommitment: form.inclusionCommitment,
    });
    if (!parsed.success) {
      setFeedback({
        tone: 'danger',
        message: parsed.error.issues.map((issue) => issue.message).join(' '),
      });
      return null;
    }
    return parsed.data;
  }

  function reviewJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = jobInput();
    if (!payload) return;
    setReviewError('');
    setPendingJob(payload);
  }

  async function saveJob() {
    if (!pendingJob) return;

    setSaving(true);
    setReviewError('');
    try {
      if (editingId) {
        await updateJob(editingId, pendingJob);
      } else {
        await createJob(pendingJob);
      }
      setEditingId(null);
      setForm(emptyForm);
      setPendingJob(null);
      await loadJobs();
      setFeedback({
        tone: 'success',
        message: editingId
          ? 'Vaga atualizada e reenviada para moderação.'
          : 'Vaga enviada para moderação. Ela ainda não está pública.',
      });
    } catch (error) {
      setReviewError(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível salvar a vaga.',
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(job: ManagedJob) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      area: job.area,
      description: job.description,
      responsibilities: job.responsibilities ?? '',
      requirements: job.requirements ?? '',
      benefits: job.benefits ?? '',
      location: job.location,
      workMode: job.workMode,
      contractType: job.contractType,
      seniority: job.seniority,
      salaryMin: job.salaryMin?.toString() ?? '',
      salaryMax: job.salaryMax?.toString() ?? '',
      salaryHiddenReason: job.salaryHiddenReason ?? '',
      accessibilityInfo: job.accessibilityInfo ?? '',
      inclusionCommitment: true,
    });
    document.getElementById('job-form')?.scrollIntoView({ behavior: 'auto' });
  }

  async function runTransition(
    job: ManagedJob,
    action: 'pause' | 'resume' | 'close' | 'republish',
  ) {
    try {
      await transitionJob(job.id, action);
      await loadJobs();
      setFeedback({ tone: 'success', message: 'Estado da vaga atualizado.' });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Falha na transição.',
      });
    }
  }

  async function confirmClose() {
    if (!pendingClose) return;

    setClosing(true);
    try {
      await transitionJob(pendingClose.id, 'close');
      setPendingClose(null);
      await loadJobs();
      setFeedback({ tone: 'success', message: 'Vaga encerrada.' });
    } catch (error) {
      setPendingClose(null);
      setFeedback({
        tone: 'danger',
        message:
          error instanceof Error ? error.message : 'Falha ao encerrar a vaga.',
      });
    } finally {
      setClosing(false);
    }
  }

  async function openApplications(job: ManagedJob) {
    setSelectedJobId(job.id);
    setApplications([]);
    setApplicationsLoading(true);
    try {
      setApplications((await listReceivedApplications(job.id)).items);
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message:
          error instanceof Error
            ? error.message
            : 'Falha ao carregar candidaturas.',
      });
    } finally {
      setApplicationsLoading(false);
    }
  }

  async function changeApplication(
    application: ReceivedApplication,
    status: 'under_review' | 'shortlisted' | 'rejected',
  ) {
    try {
      await updateApplicationStatus(application.id, status);
      if (selectedJob) await openApplications(selectedJob);
      setFeedback({
        tone: 'success',
        message: 'Status da candidatura atualizado.',
      });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message:
          error instanceof Error ? error.message : 'Falha na atualização.',
      });
    }
  }

  const set = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <section className="mx-auto max-w-vale-wide">
      <PageHeading
        as="h1"
        description="Toda criação ou edição de conteúdo volta à moderação. Pausar não altera o texto aprovado; republicar uma vaga encerrada exige nova revisão."
        eyebrow="Gestão de oportunidades"
        title="Vagas e candidaturas"
      />

      {feedback ? (
        <Alert
          className="mt-6"
          title={
            feedback.tone === 'success'
              ? 'Alteração confirmada'
              : 'Não foi possível concluir'
          }
          tone={feedback.tone}
        >
          {feedback.message}
        </Alert>
      ) : null}

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(21rem,0.75fr)]">
        <Card
          as="form"
          className="grid gap-6 p-5 sm:p-7"
          id="job-form"
          noValidate
          onSubmit={reviewJob}
        >
          <div className="flex flex-col gap-3 border-b border-vale-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-vale-action">
                {editingId ? 'Nova versão' : 'Nova vaga'}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-vale-ink">
                {editingId ? 'Corrigir e reenviar' : 'Preparar para moderação'}
              </h2>
            </div>
            {editingId ? (
              <Button
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                size="sm"
                variant="ghost"
              >
                Cancelar edição
              </Button>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField id="job-title" label="Título" required>
              <TextInput
                maxLength={160}
                minLength={3}
                onChange={(event) => set('title', event.target.value)}
                required
                value={form.title}
              />
            </FormField>
            <FormField id="job-area" label="Área" required>
              <TextInput
                maxLength={100}
                onChange={(event) => set('area', event.target.value)}
                placeholder="Ex.: Tecnologia"
                required
                value={form.area}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              hint="Texto simples. Não inclua dados pessoais de terceiros."
              id="job-description"
              label="Descrição"
              required
            >
              <TextArea
                maxLength={5000}
                minLength={50}
                onChange={(event) => set('description', event.target.value)}
                required
                rows={7}
                value={form.description}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              id="job-responsibilities"
              label="Responsabilidades (opcional)"
            >
              <TextArea
                maxLength={3000}
                onChange={(event) =>
                  set('responsibilities', event.target.value)
                }
                rows={4}
                value={form.responsibilities}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              id="job-requirements"
              label="Requisitos (opcional)"
            >
              <TextArea
                maxLength={3000}
                onChange={(event) => set('requirements', event.target.value)}
                rows={4}
                value={form.requirements}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              id="job-benefits"
              label="Benefícios (opcional)"
            >
              <TextArea
                maxLength={2000}
                onChange={(event) => set('benefits', event.target.value)}
                rows={3}
                value={form.benefits}
              />
            </FormField>
            <FormField id="job-location" label="Localidade" required>
              <TextInput
                maxLength={120}
                onChange={(event) => set('location', event.target.value)}
                required
                value={form.location}
              />
            </FormField>
            <FormField id="job-work-mode" label="Modalidade" required>
              <Select
                onChange={(event) =>
                  set('workMode', event.target.value as WorkMode)
                }
                value={form.workMode}
              >
                {Object.entries(workModeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="job-contract" label="Contrato" required>
              <Select
                onChange={(event) =>
                  set('contractType', event.target.value as ContractType)
                }
                value={form.contractType}
              >
                {Object.entries(contractLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="job-seniority" label="Senioridade" required>
              <Select
                onChange={(event) =>
                  set('seniority', event.target.value as JobSeniority)
                }
                value={form.seniority}
              >
                {Object.entries(seniorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="job-salary-min" label="Salário mínimo (R$)">
              <TextInput
                min="0"
                onChange={(event) => set('salaryMin', event.target.value)}
                step="1"
                type="number"
                value={form.salaryMin}
              />
            </FormField>
            <FormField id="job-salary-max" label="Salário máximo (R$)">
              <TextInput
                min="0"
                onChange={(event) => set('salaryMax', event.target.value)}
                step="1"
                type="number"
                value={form.salaryMax}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              hint="Informe apenas se não houver faixa salarial."
              id="job-salary-hidden-reason"
              label="Justificativa para não informar a faixa"
            >
              <TextInput
                maxLength={300}
                onChange={(event) =>
                  set('salaryHiddenReason', event.target.value)
                }
                value={form.salaryHiddenReason}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              id="job-accessibility"
              label="Acessibilidade e adaptações (opcional)"
            >
              <TextArea
                maxLength={1000}
                onChange={(event) =>
                  set('accessibilityInfo', event.target.value)
                }
                rows={3}
                value={form.accessibilityInfo}
              />
            </FormField>
          </div>

          <CheckboxField
            checked={form.inclusionCommitment}
            hint="A vaga respeita as diretrizes da comunidade e não contém critérios discriminatórios."
            id="job-inclusion-commitment"
            label="Confirmo o compromisso inclusivo da oportunidade."
            onChange={(event) =>
              set('inclusionCommitment', event.target.checked)
            }
            required
          />
          <Button fullWidth type="submit">
            {editingId ? 'Revisar atualização' : 'Revisar vaga'}
          </Button>
        </Card>

        <Card className="grid gap-6 p-5 sm:p-7">
          <div className="flex flex-col gap-2 border-b border-vale-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-vale-action">
                Portfólio de vagas
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-vale-ink">
                Minhas oportunidades
              </h2>
            </div>
            <p className="text-sm font-bold text-vale-muted">
              {jobs.length} registradas
            </p>
          </div>

          {loading ? <LoadingState label="Carregando vagas" /> : null}
          {!loading && jobs.length === 0 ? (
            <EmptyState
              description="Use o formulário para iniciar a primeira moderação."
              title="Você ainda não enviou vagas"
            />
          ) : null}
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card className="grid gap-5 p-5" key={job.id}>
                <div>
                  <JobStatusBadge status={job.status} />
                  <h3 className="mt-3 text-lg font-black tracking-[-0.03em] text-vale-ink">
                    {job.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-vale-muted">
                    {jobStatusGuidance[job.status]}
                  </p>
                  <JobMetadata
                    className="mt-4"
                    contractType={job.contractType}
                    location={job.location}
                    seniority={job.seniority}
                    workMode={job.workMode}
                  />
                </div>
                {job.moderationReason ? (
                  <Alert title="Retorno da moderação" tone="warning">
                    {job.moderationReason}
                  </Alert>
                ) : null}
                <div className="flex flex-wrap gap-3 border-t border-vale-border pt-5">
                  {['changes_requested', 'approved'].includes(job.status) ? (
                    <Button
                      onClick={() => startEditing(job)}
                      variant="secondary"
                    >
                      Editar
                    </Button>
                  ) : null}
                  {job.status === 'approved' ? (
                    <Button
                      onClick={() => void runTransition(job, 'pause')}
                      variant="secondary"
                    >
                      Pausar
                    </Button>
                  ) : null}
                  {job.status === 'paused' ? (
                    <Button
                      onClick={() => void runTransition(job, 'resume')}
                      variant="secondary"
                    >
                      Retomar
                    </Button>
                  ) : null}
                  {['approved', 'paused'].includes(job.status) ? (
                    <Button
                      onClick={() => setPendingClose(job)}
                      variant="danger"
                    >
                      Encerrar
                    </Button>
                  ) : null}
                  {job.status === 'closed' ? (
                    <Button
                      onClick={() => void runTransition(job, 'republish')}
                      variant="secondary"
                    >
                      Republicar
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => void openApplications(job)}
                    variant="ghost"
                  >
                    <Icon icon={faUsers} />
                    Ver candidaturas
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      {selectedJob ? (
        <section
          className="mt-8 border-t border-vale-border pt-8"
          aria-labelledby="received-applications-heading"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-vale-action">
                Processo seletivo
              </p>
              <h2
                className="mt-2 text-2xl font-black tracking-[-0.04em] text-vale-ink"
                id="received-applications-heading"
              >
                Candidaturas para {selectedJob.title}
              </h2>
            </div>
            <Button
              onClick={() => {
                setSelectedJobId(null);
                setApplications([]);
              }}
              variant="ghost"
            >
              Fechar
            </Button>
          </div>
          {applicationsLoading ? (
            <div className="mt-6">
              <LoadingState label="Carregando candidaturas" />
            </div>
          ) : null}
          {!applicationsLoading && applications.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                description="Novas candidaturas aparecerão aqui e poderão ser tratadas conforme as transições permitidas."
                title="Nenhuma candidatura recebida"
              />
            </div>
          ) : null}
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {applications.map((application) => (
              <Card
                className="grid content-start gap-5 p-5"
                key={application.id}
              >
                <div>
                  <ApplicationStatusBadge status={application.status} />
                  <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-vale-ink">
                    {application.candidate?.displayName ??
                      'Dados removidos após cancelamento'}
                  </h3>
                  {application.candidate ? (
                    <p className="mt-2 text-sm leading-6 text-vale-muted">
                      {application.candidate.headline ?? 'Título não informado'}
                      {application.candidate.location
                        ? ` · ${application.candidate.location}`
                        : ''}
                    </p>
                  ) : null}
                </div>
                {application.candidate?.skills.length ? (
                  <ul className="flex flex-wrap gap-2" aria-label="Habilidades">
                    {application.candidate.skills.map((skill) => (
                      <li
                        className="rounded-full bg-vale-action-subtle px-3 py-1 text-xs font-extrabold text-vale-action"
                        key={skill}
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {application.coverMessage &&
                application.status !== 'cancelled' ? (
                  <blockquote className="border-l-4 border-vale-action bg-vale-neutral-subtle px-4 py-3 text-sm leading-6 text-vale-muted">
                    {application.coverMessage}
                  </blockquote>
                ) : null}
                {application.resumeFileName &&
                application.status !== 'cancelled' ? (
                  <Button
                    onClick={() =>
                      void downloadApplicationResume(
                        application.id,
                        application.resumeFileName!,
                      )
                    }
                    variant="secondary"
                  >
                    <Icon icon={faFileArrowDown} />
                    Baixar currículo enviado
                  </Button>
                ) : null}
                {!['rejected', 'cancelled'].includes(application.status) ? (
                  <div className="flex flex-wrap gap-3 border-t border-vale-border pt-5">
                    {application.status === 'submitted' ? (
                      <Button
                        onClick={() =>
                          void changeApplication(application, 'under_review')
                        }
                        variant="secondary"
                      >
                        Iniciar análise
                      </Button>
                    ) : null}
                    {['submitted', 'under_review'].includes(
                      application.status,
                    ) ? (
                      <Button
                        onClick={() =>
                          void changeApplication(application, 'shortlisted')
                        }
                      >
                        Próxima etapa
                      </Button>
                    ) : null}
                    <Button
                      onClick={() =>
                        void changeApplication(application, 'rejected')
                      }
                      variant="danger"
                    >
                      Encerrar
                    </Button>
                  </div>
                ) : null}
                <details className="text-sm text-vale-muted">
                  <summary className="cursor-pointer font-extrabold text-vale-action">
                    Ver histórico
                  </summary>
                  <ol className="mt-3 grid gap-2 border-l-2 border-vale-border pl-4">
                    {application.history.map((entry) => (
                      <li className="grid gap-1" key={entry.id}>
                        <span className="font-bold text-vale-ink">
                          {applicationStatusLabels[entry.toStatus]}
                        </span>
                        <time dateTime={entry.changedAt}>
                          {new Date(entry.changedAt).toLocaleString('pt-BR')}
                        </time>
                      </li>
                    ))}
                  </ol>
                </details>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Dialog
        confirmLabel="Encerrar vaga"
        confirmLoading={closing}
        description={
          pendingClose
            ? `A vaga “${pendingClose.title}” deixará de receber novas candidaturas.`
            : undefined
        }
        onClose={() => setPendingClose(null)}
        onConfirm={() => void confirmClose()}
        open={Boolean(pendingClose)}
        title="Encerrar esta vaga?"
        tone="danger"
      >
        <p className="text-sm leading-6 text-vale-muted">
          Pessoas candidatas não poderão mais se inscrever. Você poderá pedir
          uma republicação, que exigirá nova moderação.
        </p>
      </Dialog>

      <Dialog
        confirmLabel={
          editingId ? 'Reenviar para moderação' : 'Enviar para moderação'
        }
        confirmLoading={saving}
        description="Revise os dados abaixo antes de enviar. A vaga só ficará pública após a decisão da equipe."
        onClose={() => setPendingJob(null)}
        onConfirm={() => void saveJob()}
        open={Boolean(pendingJob)}
        title={editingId ? 'Revisar atualização da vaga' : 'Revisar nova vaga'}
      >
        {pendingJob ? (
          <div className="grid gap-4 text-sm">
            <dl className="grid gap-3 rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4">
              <div>
                <dt className="font-extrabold text-vale-ink">Título</dt>
                <dd className="mt-1 text-vale-muted">{pendingJob.title}</dd>
              </div>
              <div>
                <dt className="font-extrabold text-vale-ink">
                  Área e localidade
                </dt>
                <dd className="mt-1 text-vale-muted">
                  {pendingJob.area} · {pendingJob.location}
                </dd>
              </div>
              <div>
                <dt className="font-extrabold text-vale-ink">Descrição</dt>
                <dd className="mt-1 max-h-28 overflow-y-auto whitespace-pre-line text-vale-muted">
                  {pendingJob.description}
                </dd>
              </div>
            </dl>
            {reviewError ? (
              <Alert title="Não foi possível enviar a vaga" tone="danger">
                {reviewError}
              </Alert>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </section>
  );
}
