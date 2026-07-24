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
