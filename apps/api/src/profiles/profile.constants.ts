import type {
  ContractType,
  EmployerProfileType,
  ProfileAssetKind,
  ProfileVisibility,
  WorkMode,
} from '@vale/shared';

export const apiProfileVisibilities = [
  'private',
  'applications_only',
  'verified_employers',
] as const satisfies readonly ProfileVisibility[];

export const apiProfileAssetKinds = [
  'avatar',
  'logo',
  'resume',
] as const satisfies readonly ProfileAssetKind[];

export const apiEmployerProfileTypes = [
  'company',
  'organization',
  'individual',
] as const satisfies readonly EmployerProfileType[];

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
