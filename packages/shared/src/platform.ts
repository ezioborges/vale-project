export const userRoles = [
  'admin',
  'coordinator',
  'employer',
  'candidate',
] as const;
export type UserRole = (typeof userRoles)[number];

export const publicRegistrationRoles = ['employer', 'candidate'] as const;
export type PublicRegistrationRole = (typeof publicRegistrationRoles)[number];

export const userStatuses = [
  'pending_email',
  'active',
  'suspended',
  'disabled',
] as const;
export type UserStatus = (typeof userStatuses)[number];

export const legalDocumentTypes = ['terms', 'privacy', 'guidelines'] as const;
export type LegalDocumentType = (typeof legalDocumentTypes)[number];

export const jobStatuses = [
  'draft',
  'pending_review',
  'changes_requested',
  'approved',
  'rejected',
  'paused',
  'closed',
  'reported',
] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const applicationStatuses = [
  'submitted',
  'under_review',
  'shortlisted',
  'rejected',
  'cancelled',
] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export const profileVisibilities = [
  'private',
  'applications_only',
  'verified_employers',
] as const;
export type ProfileVisibility = (typeof profileVisibilities)[number];

export const employerProfileTypes = [
  'company',
  'organization',
  'individual',
] as const;
export type EmployerProfileType = (typeof employerProfileTypes)[number];

export const profileAssetKinds = ['avatar', 'logo', 'resume'] as const;
export type ProfileAssetKind = (typeof profileAssetKinds)[number];

export const workModes = ['remote', 'hybrid', 'onsite'] as const;
export type WorkMode = (typeof workModes)[number];

export const contractTypes = [
  'clt',
  'pj',
  'internship',
  'temporary',
  'freelance',
  'other',
] as const;
export type ContractType = (typeof contractTypes)[number];

export const jobSeniorities = [
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'specialist',
  'not_applicable',
] as const;
export type JobSeniority = (typeof jobSeniorities)[number];

export const jobModerationDecisions = [
  'approve',
  'request_changes',
  'reject',
] as const;
export type JobModerationDecision = (typeof jobModerationDecisions)[number];

export const reportTargetTypes = [
  'job',
  'profile',
  'user',
  'application',
] as const;
export type ReportTargetType = (typeof reportTargetTypes)[number];

export const reportReasons = [
  'discrimination',
  'harassment',
  'fraud',
  'inappropriate_content',
  'privacy',
  'spam',
  'other',
] as const;
export type ReportReason = (typeof reportReasons)[number];

export const reportStatuses = [
  'open',
  'in_review',
  'resolved',
  'dismissed',
] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const reportPriorities = ['low', 'normal', 'high', 'urgent'] as const;
export type ReportPriority = (typeof reportPriorities)[number];

export const reportDecisionActions = [
  'start_review',
  'resolve',
  'dismiss',
  'hide_job',
  'restore_job',
] as const;
export type ReportDecisionAction = (typeof reportDecisionActions)[number];
