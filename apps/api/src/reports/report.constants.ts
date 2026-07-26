import type {
  ReportDecisionAction,
  ReportPriority,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@vale/shared';

export const apiReportTargetTypes = [
  'job',
  'profile',
  'user',
  'application',
] as const satisfies readonly ReportTargetType[];

export const apiReportReasons = [
  'discrimination',
  'harassment',
  'fraud',
  'inappropriate_content',
  'privacy',
  'spam',
  'other',
] as const satisfies readonly ReportReason[];

export const apiReportStatuses = [
  'open',
  'in_review',
  'resolved',
  'dismissed',
] as const satisfies readonly ReportStatus[];

export const apiReportPriorities = [
  'low',
  'normal',
  'high',
  'urgent',
] as const satisfies readonly ReportPriority[];

export const apiReportDecisionActions = [
  'start_review',
  'resolve',
  'dismiss',
  'hide_job',
  'restore_job',
] as const satisfies readonly ReportDecisionAction[];
