'use client';

import {
  faArrowLeft,
  faCircleCheck,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import type { CandidateProfile, PublicJob } from '@vale/shared';
import { FormEvent, useEffect, useState } from 'react';

import {
  ApiRequestError,
  getMyProfile,
  getPublicJob,
  submitApplication,
  updateCandidateVisibility,
} from '@/lib/api';
import { ReportControl } from '@/components/report-control';

import { formatSalary, JobMetadata } from './market-status';
import { Badge } from './ui/badge';
import { ActionLink, Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, LoadingState } from './ui/feedback';
import { FormField, TextArea } from './ui/form-field';
import { Icon } from './ui/icon';
import { PageHeading } from './ui/page-heading';

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

  async function apply(event: FormEvent<HTMLFormElement>) {
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
    return (
      <div className="mx-auto max-w-vale-content px-5 py-20 sm:px-6 lg:px-8">
        <LoadingState label="Carregando oportunidade" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto grid max-w-vale-content gap-6 px-5 py-20 text-center sm:px-6 lg:px-8">
        <PageHeading
          as="h1"
          description={
            message ||
            'A oportunidade pode ter sido encerrada ou removida da busca pública.'
          }
          title="Esta vaga não está disponível"
        />
        <div>
          <ActionLink href="/vagas" variant="secondary">
            Voltar para a busca
          </ActionLink>
        </div>
      </div>
    );
  }

  const visibilityBlocked =
    profile?.visibility === 'private' ||
    (profile?.visibility === 'verified_employers' && !job.employer.isVerified);
  const profileReady =
    profile?.isActive && profile.resume && !visibilityBlocked;

  return (
    <main className="mx-auto grid max-w-vale-wide gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.65fr)] lg:px-8 lg:py-14">
      <article className="min-w-0">
        <ActionLink href="/vagas" size="sm" variant="ghost">
          <Icon icon={faArrowLeft} />
          Voltar para vagas
        </ActionLink>

        <div className="mt-7 border-b border-vale-border pb-8">
          <PageHeading
            as="h1"
            description={
              <span className="flex flex-wrap items-center gap-2">
                <span>{job.employer.displayName}</span>
                {job.employer.isVerified ? (
                  <Badge tone="success">Organização verificada</Badge>
                ) : null}
              </span>
            }
            eyebrow={job.area}
            title={job.title}
          />
          <JobMetadata
            area={job.area}
            className="mt-6"
            contractType={job.contractType}
            location={job.location}
            seniority={job.seniority}
            workMode={job.workMode}
          />
        </div>

        <div className="mt-8 grid gap-8">
          <JobSection title="Sobre a oportunidade">
            {job.description}
          </JobSection>
          {job.responsibilities ? (
            <JobSection title="Responsabilidades">
              {job.responsibilities}
            </JobSection>
          ) : null}
          {job.requirements ? (
            <JobSection title="Requisitos">{job.requirements}</JobSection>
          ) : null}
          {job.benefits ? (
            <JobSection title="Benefícios">{job.benefits}</JobSection>
          ) : null}
          {job.accessibilityInfo ? (
            <Alert
              icon={<Icon icon={faShieldHalved} />}
              title="Acessibilidade e adaptações"
              tone="info"
            >
              <p className="whitespace-pre-line">{job.accessibilityInfo}</p>
            </Alert>
          ) : null}
        </div>
      </article>

      <Card as="aside" className="h-fit p-5 sm:p-6 lg:sticky lg:top-6">
        <Badge tone="info">Candidatura segura</Badge>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-vale-ink">
          {formatSalary(job)}
        </h2>
        <p className="mt-3 text-sm leading-6 text-vale-muted">
          Antes de confirmar, você revisa os dados compartilhados. O currículo
          atual é preservado em uma cópia privada vinculada a este processo.
        </p>

        {!showReview ? (
          <Button
            className="mt-6 w-full"
            loading={checking}
            loadingLabel="Verificando perfil"
            onClick={() => void beginApplication()}
          >
            Revisar e candidatar-se
          </Button>
        ) : null}

        {showReview && profile && !success ? (
          <form className="mt-6 grid gap-5" onSubmit={apply}>
            <section
              aria-labelledby="sharing-summary-heading"
              className="rounded-vale-md border border-vale-border bg-vale-neutral-subtle p-4"
            >
              <h3
                className="text-sm font-extrabold text-vale-ink"
                id="sharing-summary-heading"
              >
                Dados que serão compartilhados
              </h3>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-6 text-vale-muted">
                <li>Perfil profissional ativo</li>
                <li>
                  Currículo: {profile.resume?.fileName ?? 'ainda não enviado'}
                </li>
                <li>Mensagem de apresentação, se preenchida</li>
              </ul>
            </section>

            {!profile.isActive ? (
              <Alert title="Ative seu perfil antes de continuar" tone="warning">
                Um perfil desativado não pode ser compartilhado em uma
                candidatura.
              </Alert>
            ) : null}
            {!profile.resume ? (
              <Alert
                title="Envie um currículo PDF antes de continuar"
                tone="warning"
              >
                O currículo será preservado somente neste processo seletivo.
              </Alert>
            ) : null}
            {visibilityBlocked ? (
              <Alert title="Uma escolha explícita é necessária" tone="warning">
                <p>
                  Sua configuração atual não permite compartilhar o perfil com
                  esta organização. Você pode liberar apenas as organizações
                  ligadas às suas candidaturas.
                </p>
                <Button
                  className="mt-4"
                  loading={checking}
                  loadingLabel="Atualizando visibilidade"
                  onClick={() => void allowApplicationsOnly()}
                  type="button"
                  variant="secondary"
                >
                  Usar “apenas candidaturas”
                </Button>
              </Alert>
            ) : null}

            <FormField
              hint="Opcional. Não inclua informações sensíveis que não sejam necessárias ao processo."
              id="cover-message"
              label="Mensagem de apresentação"
            >
              <TextArea
                disabled={applying}
                maxLength={1500}
                onChange={(event) => setCoverMessage(event.target.value)}
                placeholder="Conte brevemente por que esta oportunidade faz sentido para você."
                rows={6}
                value={coverMessage}
              />
            </FormField>
            <Button
              fullWidth
              loading={applying}
              loadingLabel="Enviando candidatura"
              type="submit"
              disabled={!profileReady}
            >
              Confirmar candidatura
            </Button>
          </form>
        ) : null}

        {success ? (
          <Alert
            className="mt-6"
            icon={<Icon icon={faCircleCheck} />}
            title="Candidatura confirmada"
            tone="success"
          >
            <p>{message}</p>
            <ActionLink
              className="mt-4"
              href="/app/candidato/candidaturas"
              variant="secondary"
            >
              Ver minhas candidaturas
            </ActionLink>
          </Alert>
        ) : null}

        {message && !success ? (
          <Alert
            className="mt-6"
            title="Não foi possível continuar"
            tone="danger"
          >
            {message}
          </Alert>
        ) : null}

        <div className="mt-6 border-t border-vale-border pt-5">
          <ReportControl targetId={job.id} targetType="job" />
        </div>
      </Card>
    </main>
  );
}

function JobSection({ children, title }: { children: string; title: string }) {
  return (
    <section className="border-t border-vale-border pt-7">
      <h2 className="text-xl font-black tracking-[-0.03em] text-vale-ink">
        {title}
      </h2>
      <p className="mt-3 whitespace-pre-line text-base leading-7 text-vale-muted">
        {children}
      </p>
    </section>
  );
}
