import type {
  ReportPriority,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  UserRole,
  UserStatus,
} from '@vale/shared';

import { Badge, type BadgeTone } from './ui/badge';

export const reportStatusLabels: Record<ReportStatus, string> = {
  open: 'Recebida',
  in_review: 'Em análise',
  resolved: 'Resolvida',
  dismissed: 'Encerrada sem ação',
};

export const reportPriorityLabels: Record<ReportPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

export const reportReasonLabels: Record<ReportReason, string> = {
  discrimination: 'Discriminação',
  harassment: 'Assédio ou intimidação',
  fraud: 'Fraude ou informação enganosa',
  inappropriate_content: 'Conteúdo inadequado',
  privacy: 'Privacidade ou exposição de dados',
  spam: 'Spam',
  other: 'Outro motivo',
};

export const reportTargetLabels: Record<ReportTargetType, string> = {
  job: 'Vaga',
  profile: 'Perfil',
  user: 'Usuário',
  application: 'Candidatura',
};

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Administração',
  coordinator: 'Coordenação',
  employer: 'Pessoa contratante',
  candidate: 'Pessoa candidata',
};

export const userStatusLabels: Record<UserStatus, string> = {
  pending_email: 'E-mail pendente',
  active: 'Ativa',
  suspended: 'Suspensa',
  disabled: 'Desativada',
};

const reportStatusTones: Record<ReportStatus, BadgeTone> = {
  open: 'warning',
  in_review: 'info',
  resolved: 'success',
  dismissed: 'neutral',
};

const reportPriorityTones: Record<ReportPriority, BadgeTone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge tone={reportStatusTones[status]}>{reportStatusLabels[status]}</Badge>
  );
}

export function ReportPriorityBadge({
  priority,
}: {
  priority: ReportPriority;
}) {
  return (
    <Badge tone={reportPriorityTones[priority]}>
      Prioridade {reportPriorityLabels[priority]}
    </Badge>
  );
}
