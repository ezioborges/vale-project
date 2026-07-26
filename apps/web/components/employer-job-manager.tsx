'use client';

import {
  jobInputSchema,
  type ApplicationStatus,
  type ContractType,
  type JobInput,
  type JobSeniority,
  type JobStatus,
  type ManagedJob,
  type ReceivedApplication,
  type WorkMode,
} from '@vale/shared';
import { FormEvent, useCallback, useEffect, useState } from 'react';

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

const statusLabels: Record<JobStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Em moderação',
  changes_requested: 'Ajustes solicitados',
  approved: 'Publicada',
  rejected: 'Rejeitada',
  paused: 'Pausada',
  closed: 'Encerrada',
  reported: 'Sinalizada',
};

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: 'Recebida',
  under_review: 'Em análise',
  shortlisted: 'Próxima etapa',
  rejected: 'Encerrada',
  cancelled: 'Cancelada',
};

type JobFormState = {
  title: string;
  area: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  location: string;
  workMode: WorkMode;
  contractType: ContractType;
  seniority: JobSeniority;
  salaryMin: string;
  salaryMax: string;
  salaryHiddenReason: string;
  accessibilityInfo: string;
  inclusionCommitment: boolean;
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
  const [selectedJob, setSelectedJob] = useState<ManagedJob | null>(null);
  const [applications, setApplications] = useState<ReceivedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await listMyJobs();
      setJobs(result.items);
      if (selectedJob) {
        setSelectedJob(
          result.items.find((job) => job.id === selectedJob.id) ?? null,
        );
      }
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível carregar suas vagas.',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    void loadJobs();
  }, []);

  function input(): JobInput | null {
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
      setMessage(parsed.error.issues.map((issue) => issue.message).join(' '));
      return null;
    }
    return parsed.data;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = input();
    if (!payload) return;
    setSaving(true);
    setMessage('');
    try {
      if (editingId) {
        await updateJob(editingId, payload);
        setMessage('Vaga atualizada e reenviada para moderação.');
      } else {
        await createJob(payload);
        setMessage('Vaga enviada para moderação. Ela ainda não está pública.');
      }
      setEditingId(null);
      setForm(emptyForm);
      await loadJobs();
    } catch (error) {
      setMessage(
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
    document.getElementById('job-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function runTransition(
    job: ManagedJob,
    action: 'pause' | 'resume' | 'close' | 'republish',
  ) {
    setMessage('');
    try {
      await transitionJob(job.id, action);
      setMessage('Estado da vaga atualizado.');
      await loadJobs();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Falha na transição.',
      );
    }
  }

  async function openApplications(job: ManagedJob) {
    setSelectedJob(job);
    setApplications([]);
    setMessage('');
    try {
      setApplications((await listReceivedApplications(job.id)).items);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Falha ao carregar candidaturas.',
      );
    }
  }

  async function changeApplication(
    application: ReceivedApplication,
    status: 'under_review' | 'shortlisted' | 'rejected',
  ) {
    setMessage('');
    try {
      await updateApplicationStatus(application.id, status);
      if (selectedJob) await openApplications(selectedJob);
      setMessage('Status da candidatura atualizado.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Falha na atualização.',
      );
    }
  }

  const set = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <section className="management-page employer-management">
      <div className="management-hero">
        <span className="eyebrow">Gestão de oportunidades</span>
        <h1>Vagas e candidaturas</h1>
        <p>
          Toda criação ou edição de conteúdo volta à moderação. Pausar não
          altera o texto aprovado; republicar uma vaga encerrada exige nova
          revisão.
        </p>
      </div>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      <div className="management-grid">
        <form className="job-editor" id="job-form" onSubmit={submit}>
          <div className="editor-heading">
            <div>
              <span className="eyebrow">
                {editingId ? 'Nova versão' : 'Nova vaga'}
              </span>
              <h2>
                {editingId ? 'Corrigir e reenviar' : 'Enviar para moderação'}
              </h2>
            </div>
            {editingId && (
              <button
                className="text-action"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div className="field-grid">
            <label>
              Título
              <input
                required
                minLength={3}
                maxLength={160}
                value={form.title}
                onChange={(event) => set('title', event.target.value)}
              />
            </label>
            <label>
              Área
              <input
                required
                maxLength={100}
                value={form.area}
                onChange={(event) => set('area', event.target.value)}
                placeholder="Ex.: Tecnologia"
              />
            </label>
            <label className="field-span">
              Descrição
              <textarea
                required
                minLength={50}
                maxLength={5000}
                rows={7}
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
              />
              <small className="field-help">
                Texto simples. Não inclua dados pessoais de terceiros.
              </small>
            </label>
            <label className="field-span">
              Responsabilidades <span className="optional-mark">opcional</span>
              <textarea
                rows={4}
                maxLength={3000}
                value={form.responsibilities}
                onChange={(event) =>
                  set('responsibilities', event.target.value)
                }
              />
            </label>
            <label className="field-span">
              Requisitos <span className="optional-mark">opcional</span>
              <textarea
                rows={4}
                maxLength={3000}
                value={form.requirements}
                onChange={(event) => set('requirements', event.target.value)}
              />
            </label>
            <label className="field-span">
              Benefícios <span className="optional-mark">opcional</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={form.benefits}
                onChange={(event) => set('benefits', event.target.value)}
              />
            </label>
            <label>
              Localidade
              <input
                required
                maxLength={120}
                value={form.location}
                onChange={(event) => set('location', event.target.value)}
              />
            </label>
            <label>
              Modalidade
              <select
                value={form.workMode}
                onChange={(event) =>
                  set('workMode', event.target.value as WorkMode)
                }
              >
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
            </label>
            <label>
              Contrato
              <select
                value={form.contractType}
                onChange={(event) =>
                  set('contractType', event.target.value as ContractType)
                }
              >
                <option value="clt">CLT</option>
                <option value="pj">PJ</option>
                <option value="internship">Estágio</option>
                <option value="temporary">Temporário</option>
                <option value="freelance">Freelance</option>
                <option value="other">Outro</option>
              </select>
            </label>
            <label>
              Senioridade
              <select
                value={form.seniority}
                onChange={(event) =>
                  set('seniority', event.target.value as JobSeniority)
                }
              >
                <option value="intern">Estágio</option>
                <option value="junior">Júnior</option>
                <option value="mid">Pleno</option>
                <option value="senior">Sênior</option>
                <option value="lead">Liderança</option>
                <option value="specialist">Especialista</option>
                <option value="not_applicable">Não se aplica</option>
              </select>
            </label>
            <label>
              Salário mínimo (R$)
              <input
                type="number"
                min="0"
                step="1"
                value={form.salaryMin}
                onChange={(event) => set('salaryMin', event.target.value)}
              />
            </label>
            <label>
              Salário máximo (R$)
              <input
                type="number"
                min="0"
                step="1"
                value={form.salaryMax}
                onChange={(event) => set('salaryMax', event.target.value)}
              />
            </label>
            <label className="field-span">
              Justificativa se a faixa não for informada
              <input
                maxLength={300}
                value={form.salaryHiddenReason}
                onChange={(event) =>
                  set('salaryHiddenReason', event.target.value)
                }
              />
            </label>
            <label className="field-span">
              Acessibilidade e adaptações{' '}
              <span className="optional-mark">opcional</span>
              <textarea
                rows={3}
                maxLength={1000}
                value={form.accessibilityInfo}
                onChange={(event) =>
                  set('accessibilityInfo', event.target.value)
                }
              />
            </label>
          </div>
          <label className="inclusion-confirmation">
            <input
              type="checkbox"
              checked={form.inclusionCommitment}
              onChange={(event) =>
                set('inclusionCommitment', event.target.checked)
              }
            />
            <span>
              <strong>Confirmo o compromisso inclusivo da oportunidade.</strong>
              <small>
                A vaga respeita as diretrizes da comunidade e não contém
                critérios discriminatórios.
              </small>
            </span>
          </label>
          <button className="primary-action" disabled={saving}>
            {saving
              ? 'Enviando…'
              : editingId
                ? 'Reenviar para moderação'
                : 'Enviar vaga para moderação'}
          </button>
        </form>

        <div className="managed-jobs">
          <div className="editor-heading">
            <div>
              <span className="eyebrow">Portfólio de vagas</span>
              <h2>Minhas oportunidades</h2>
            </div>
            <span>{jobs.length} registradas</span>
          </div>

          {loading && <div className="empty-state-card">Carregando vagas…</div>}
          {!loading && jobs.length === 0 && (
            <div className="empty-state-card">
              <strong>Você ainda não enviou vagas.</strong>
              <span>Use o formulário para iniciar a primeira moderação.</span>
            </div>
          )}
          <div className="managed-job-list">
            {jobs.map((job) => (
              <article className="managed-job-card" key={job.id}>
                <div className="managed-job-heading">
                  <span className={`status-badge status-${job.status}`}>
                    {statusLabels[job.status]}
                  </span>
                  <h3>{job.title}</h3>
                  <p>
                    {job.area} · {job.location}
                  </p>
                </div>
                {job.moderationReason && (
                  <div className="moderation-reason">
                    <strong>Retorno da moderação</strong>
                    <p>{job.moderationReason}</p>
                  </div>
                )}
                <div className="inline-actions">
                  {['changes_requested', 'approved'].includes(job.status) && (
                    <button
                      className="secondary-action"
                      onClick={() => startEditing(job)}
                    >
                      Editar
                    </button>
                  )}
                  {job.status === 'approved' && (
                    <button
                      className="secondary-action"
                      onClick={() => void runTransition(job, 'pause')}
                    >
                      Pausar
                    </button>
                  )}
                  {job.status === 'paused' && (
                    <button
                      className="secondary-action"
                      onClick={() => void runTransition(job, 'resume')}
                    >
                      Retomar
                    </button>
                  )}
                  {['approved', 'paused'].includes(job.status) && (
                    <button
                      className="danger-action"
                      onClick={() => void runTransition(job, 'close')}
                    >
                      Encerrar
                    </button>
                  )}
                  {job.status === 'closed' && (
                    <button
                      className="secondary-action"
                      onClick={() => void runTransition(job, 'republish')}
                    >
                      Republicar
                    </button>
                  )}
                  <button
                    className="text-action"
                    onClick={() => void openApplications(job)}
                  >
                    Ver candidaturas
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {selectedJob && (
        <section className="received-section">
          <div className="editor-heading">
            <div>
              <span className="eyebrow">Processo seletivo</span>
              <h2>Candidaturas para {selectedJob.title}</h2>
            </div>
            <button
              className="text-action"
              onClick={() => {
                setSelectedJob(null);
                setApplications([]);
              }}
            >
              Fechar
            </button>
          </div>
          {applications.length === 0 ? (
            <div className="empty-state-card">
              Nenhuma candidatura recebida para esta vaga.
            </div>
          ) : (
            <div className="received-grid">
              {applications.map((application) => (
                <article className="received-card" key={application.id}>
                  <span className={`status-badge status-${application.status}`}>
                    {applicationStatusLabels[application.status]}
                  </span>
                  <h3>
                    {application.candidate?.displayName ??
                      'Dados removidos após cancelamento'}
                  </h3>
                  {application.candidate && (
                    <p>
                      {application.candidate.headline ?? 'Título não informado'}
                      {application.candidate.location
                        ? ` · ${application.candidate.location}`
                        : ''}
                    </p>
                  )}
                  {application.candidate &&
                    application.candidate.skills.length > 0 && (
                      <div className="tag-list">
                        {application.candidate.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    )}
                  {application.coverMessage &&
                    application.status !== 'cancelled' && (
                      <blockquote>{application.coverMessage}</blockquote>
                    )}
                  {application.resumeFileName &&
                    application.status !== 'cancelled' && (
                      <button
                        className="secondary-action"
                        onClick={() =>
                          void downloadApplicationResume(
                            application.id,
                            application.resumeFileName!,
                          )
                        }
                      >
                        Baixar currículo enviado
                      </button>
                    )}
                  {!['rejected', 'cancelled'].includes(application.status) && (
                    <div className="inline-actions">
                      {application.status === 'submitted' && (
                        <button
                          className="secondary-action"
                          onClick={() =>
                            void changeApplication(application, 'under_review')
                          }
                        >
                          Iniciar análise
                        </button>
                      )}
                      {['submitted', 'under_review'].includes(
                        application.status,
                      ) && (
                        <button
                          className="primary-action"
                          onClick={() =>
                            void changeApplication(application, 'shortlisted')
                          }
                        >
                          Próxima etapa
                        </button>
                      )}
                      <button
                        className="danger-action"
                        onClick={() =>
                          void changeApplication(application, 'rejected')
                        }
                      >
                        Encerrar
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
