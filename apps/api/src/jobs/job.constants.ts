import type {
  ApplicationStatus,
  ContractType,
  JobModerationDecision,
  JobSeniority,
  JobStatus,
  WorkMode,
} from '@vale/shared';

export const apiJobStatuses = [
  'draft',
  'pending_review',
  'changes_requested',
  'approved',
  'rejected',
  'paused',
  'closed',
  'reported',
] as const satisfies readonly JobStatus[];

export const apiApplicationStatuses = [
  'submitted',
  'under_review',
  'shortlisted',
  'rejected',
  'cancelled',
] as const satisfies readonly ApplicationStatus[];

export const apiWorkModes = [
  'remote',
  'hybrid',
  'onsite',
] as const satisfies readonly WorkMode[];

export const apiContractTypes = [
  'clt',
  'pj',
  'internship',
  'temporary',
  'freelance',
  'other',
] as const satisfies readonly ContractType[];

export const apiJobSeniorities = [
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'specialist',
  'not_applicable',
] as const satisfies readonly JobSeniority[];

export const apiJobModerationDecisions = [
  'approve',
  'request_changes',
  'reject',
] as const satisfies readonly JobModerationDecision[];

export const activeJobStatuses = [
  'pending_review',
  'changes_requested',
  'approved',
  'paused',
] as const;
