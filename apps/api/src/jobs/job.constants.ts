import {
  applicationStatuses,
  contractTypes,
  jobModerationDecisions,
  jobSeniorities,
  jobStatuses,
  workModes,
} from '@vale/shared';

export const apiJobStatuses = [...jobStatuses] as const;
export const apiApplicationStatuses = [...applicationStatuses] as const;
export const apiWorkModes = [...workModes] as const;
export const apiContractTypes = [...contractTypes] as const;
export const apiJobSeniorities = [...jobSeniorities] as const;
export const apiJobModerationDecisions = [...jobModerationDecisions] as const;

export const activeJobStatuses = [
  'pending_review',
  'changes_requested',
  'approved',
  'paused',
] as const;

