import type {
  ApplicationStatus,
  ContractType,
  JobSeniority,
  JobStatus,
  WorkMode,
} from '@vale/shared';

import { Badge, type BadgeTone } from './ui/badge';
import { classNames } from './ui/class-names';

export const workModeLabels: Record<WorkMode, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
};

export const contractLabels: Record<ContractType, string> = {
  clt: 'CLT',
  pj: 'PJ',
  internship: 'Estágio',
  temporary: 'Temporário',
  freelance: 'Freelance',
  other: 'Outro',
};

export const seniorityLabels: Record<JobSeniority, string> = {
  intern: 'Estágio',
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Liderança',
  specialist: 'Especialista',
  not_applicable: 'Não se aplica',
};

export const jobStatusLabels: Record<JobStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Em moderação',
  changes_requested: 'Ajustes solicitados',
  approved: 'Publicada',
  rejected: 'Rejeitada',
  paused: 'Pausada',
  closed: 'Encerrada',
  reported: 'Sinalizada',
};

const jobStatusTones: Record<JobStatus, BadgeTone> = {
  draft: 'neutral',
  pending_review: 'warning',
  changes_requested: 'warning',
  approved: 'success',
  rejected: 'danger',
  paused: 'neutral',
  closed: 'neutral',
  reported: 'danger',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: 'Enviada',
  under_review: 'Em análise',
  shortlisted: 'Próxima etapa',
  rejected: 'Encerrada',
  cancelled: 'Cancelada',
};

const applicationStatusTones: Record<ApplicationStatus, BadgeTone> = {
  submitted: 'info',
  under_review: 'warning',
  shortlisted: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

export const jobStatusGuidance: Record<JobStatus, string> = {
  draft: 'A vaga ainda não foi enviada para revisão.',
  pending_review: 'A equipe está revisando o conteúdo antes da publicação.',
  changes_requested: 'Revise o retorno da moderação e envie uma nova versão.',
  approved: 'A oportunidade está visível na busca pública.',
  rejected: 'Esta versão não será publicada. Consulte o motivo registrado.',
  paused: 'A vaga não recebe novas candidaturas enquanto estiver pausada.',
  closed: 'O processo foi encerrado e não recebe novas candidaturas.',
  reported: 'A vaga foi sinalizada e aguarda tratamento da equipe.',
};

export const applicationStatusGuidance: Record<ApplicationStatus, string> = {
  submitted: 'Sua candidatura foi enviada e aguarda a análise da organização.',
  under_review: 'A organização está analisando sua candidatura.',
  shortlisted: 'A organização indicou você para a próxima etapa.',
  rejected: 'Este processo foi encerrado pela organização.',
  cancelled: 'Você cancelou a candidatura e o acesso relacional foi revogado.',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={jobStatusTones[status]}>{jobStatusLabels[status]}</Badge>;
}

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <Badge tone={applicationStatusTones[status]}>
      {applicationStatusLabels[status]}
    </Badge>
  );
}

type JobMetadataProps = {
  area?: string;
  className?: string;
  contractType: ContractType;
  location?: string;
  seniority: JobSeniority;
  workMode: WorkMode;
};

/** Metadados breves para comparar vagas sem repetir o conteúdo do detalhe. */
export function JobMetadata({
  area,
  className,
  contractType,
  location,
  seniority,
  workMode,
}: JobMetadataProps) {
  return (
    <ul
      className={classNames('flex flex-wrap gap-2', className)}
      aria-label="Características da oportunidade"
    >
      {area ? (
        <li>
          <Badge tone="accent">{area}</Badge>
        </li>
      ) : null}
      <li>
        <Badge tone="info">{workModeLabels[workMode]}</Badge>
      </li>
      <li>
        <Badge tone="neutral">{contractLabels[contractType]}</Badge>
      </li>
      <li>
        <Badge tone="neutral">{seniorityLabels[seniority]}</Badge>
      </li>
      {location ? (
        <li>
          <Badge tone="neutral">{location}</Badge>
        </li>
      ) : null}
    </ul>
  );
}

type SalaryFields = {
  salaryHiddenReason: string | null;
  salaryMax: number | null;
  salaryMin: number | null;
};

export function formatSalary({
  salaryHiddenReason,
  salaryMax,
  salaryMin,
}: SalaryFields): string {
  if (salaryMin !== null && salaryMax !== null) {
    return `${salaryMin.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })} – ${salaryMax.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })}`;
  }

  return salaryHiddenReason ?? 'Faixa não informada';
}
