'use client';

import type { CandidateProfile, PublicJob } from '@vale/shared';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

import {
  ApiRequestError,
  getMyProfile,
  getPublicJob,
  submitApplication,
  updateCandidateVisibility,
} from '@/lib/api';
import { ReportControl } from '@/components/report-control';

const labels = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
  clt: 'CLT',
  pj: 'PJ',
  internship: 'Estágio',
  temporary: 'Temporário',
  freelance: 'Freelance',
  other: 'Outro',
  intern: 'Estágio',
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Liderança',
  specialist: 'Especialista',
  not_applicable: 'Não se aplica',
} as const;

export function JobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<PublicJob | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void getPublicJob(jobId)
      .then(setJob)
      .catch((error) =>
        setMessage(
          error instanceof ApiRequestError
            ? error.message
            : 'Vaga indisponível.',
        ),
      )
      .finally(() => setLoading(false));
  }, [jobId]);

  async function beginApplication() {
    setChecking(true);
    setMessage('');
    try {
      const current = await getMyProfile();
      if (!current || current.kind !== 'candidate') {
        setMessage(
          'Entre com uma conta de candidato e complete seu perfil para se candidatar.',
        );
        return;
      }
      setProfile(current);
      setShowReview(true);
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError && error.status === 401
          ? 'Entre na sua conta de candidato para continuar.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível revisar seu perfil.',
      );
    } finally {
      setChecking(false);
    }
  }

  async function allowApplicationsOnly() {
    setChecking(true);
    setMessage('');
    try {
      setProfile(await updateCandidateVisibility('applications_only'));
      setMessage(
        'Visibilidade atualizada. Apenas contratantes das suas candidaturas terão acesso.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Falha ao atualizar.',
      );
    } finally {
      setChecking(false);
    }
  }

  async function apply(event: FormEvent) {
    event.preventDefault();
    setApplying(true);
    setMessage('');
    try {
      await submitApplication(jobId, coverMessage.trim() || null);
      setSuccess(true);
      setMessage(
        'Candidatura enviada. Seu currículo foi preservado em uma cópia privada vinculada a este processo.',
      );
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'Não foi possível enviar a candidatura.',
      );
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <div className="job-detail-state">Carregando oportunidade…</div>;
  }
  if (!job) {
    return (
      <div className="job-detail-state">
        <h1>Esta vaga não está disponível.</h1>
        <p>{message}</p>
        <Link className="secondary-action" href="/vagas">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  const visibilityBlocked =
    profile?.visibility === 'private' ||
    (profile?.visibility === 'verified_employers' && !job.employer.isVerified);
  const profileReady =
    profile?.isActive && profile.resume && !visibilityBlocked;

  return (
    <div className="job-detail-layout">
      <article className="job-detail-content">
        <Link className="back-link" href="/vagas">
          ← Voltar para vagas
        </Link>
        <div className="job-detail-hero">
          <span className="eyebrow">{job.area}</span>
          <h1>{job.title}</h1>
          <p>
            {job.employer.displayName}
            {job.employer.isVerified ? ' · Organização verificada' : ''}
          </p>
        </div>
        <div className="job-facts">
          <span>{labels[job.workMode]}</span>
          <span>{labels[job.contractType]}</span>
          <span>{labels[job.seniority]}</span>
          <span>{job.location}</span>
        </div>
        <section>
          <h2>Sobre a oportunidade</h2>
          <p>{job.description}</p>
        </section>
        {job.responsibilities && (
          <section>
            <h2>Responsabilidades</h2>
            <p>{job.responsibilities}</p>
          </section>
        )}
        {job.requirements && (
          <section>
            <h2>Requisitos</h2>
            <p>{job.requirements}</p>
          </section>
        )}
        {job.benefits && (
          <section>
            <h2>Benefícios</h2>
            <p>{job.benefits}</p>
          </section>
        )}
        {job.accessibilityInfo && (
          <section className="accessibility-card">
            <h2>Acessibilidade e adaptações</h2>
            <p>{job.accessibilityInfo}</p>
          </section>
        )}
      </article>

      <aside className="application-panel">
        <span className="eyebrow">Candidatura segura</span>
        <h2>
          {job.salaryMin !== null && job.salaryMax !== null
            ? `${job.salaryMin.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })} – ${job.salaryMax.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })}`
            : job.salaryHiddenReason}
        </h2>
        <p>
          Ao se candidatar, uma cópia imutável do currículo atual será
          preservada. O acesso nasce somente para o responsável por esta vaga.
        </p>

        {!showReview && (
          <button
            className="primary-action"
            disabled={checking}
            onClick={() => void beginApplication()}
          >
            {checking ? 'Verificando perfil…' : 'Revisar e candidatar-se'}
          </button>
        )}

        {showReview && profile && !success && (
          <form className="application-review" onSubmit={apply}>
            <div className="sharing-summary">
              <strong>Dados que serão compartilhados</strong>
              <ul>
                <li>Perfil profissional ativo</li>
                <li>
                  Currículo: {profile.resume?.fileName ?? 'ainda não enviado'}
                </li>
                <li>Mensagem de apresentação, se preenchida</li>
              </ul>
            </div>

            {!profile.isActive && (
              <p className="notice error-notice">
                Ative seu perfil antes de se candidatar.
              </p>
            )}
            {!profile.resume && (
              <p className="notice error-notice">
                Envie um currículo PDF no seu perfil antes de continuar.
              </p>
            )}
            {visibilityBlocked && (
              <div className="visibility-consent-card">
                <strong>Uma escolha explícita é necessária</strong>
                <p>
                  Sua configuração atual não permite compartilhar o perfil com
                  este contratante. Você pode liberar somente as organizações
                  ligadas às suas candidaturas.
                </p>
                <button
                  className="secondary-action"
                  type="button"
                  disabled={checking}
                  onClick={() => void allowApplicationsOnly()}
                >
                  Usar “apenas candidaturas”
                </button>
              </div>
            )}

            <label>
              Mensagem de apresentação{' '}
              <span className="optional-mark">opcional</span>
              <textarea
                rows={6}
                maxLength={1500}
                value={coverMessage}
                onChange={(event) => setCoverMessage(event.target.value)}
                placeholder="Conte brevemente por que esta oportunidade faz sentido para você."
              />
            </label>
            <button
              className="primary-action"
              disabled={!profileReady || applying}
            >
              {applying ? 'Enviando…' : 'Confirmar candidatura'}
            </button>
          </form>
        )}

        {success && (
          <div className="success-card">
            <strong>Candidatura confirmada</strong>
            <p>Acompanhe cada mudança de status na sua área.</p>
            <Link
              className="secondary-action"
              href="/app/candidato/candidaturas"
            >
              Ver minhas candidaturas
            </Link>
          </div>
        )}

        {message && (
          <p
            className={`notice ${success ? 'success-notice' : ''}`}
            role="status"
          >
            {message}
          </p>
        )}

        <ReportControl targetType="job" targetId={job.id} />
      </aside>
    </div>
  );
}
