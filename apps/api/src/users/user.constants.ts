export const apiUserRoles = [
  'admin',
  'coordinator',
  'employer',
  'candidate',
] as const;

export const apiPublicRegistrationRoles = ['candidate', 'employer'] as const;

export const apiUserStatuses = [
  'pending_email',
  'active',
  'suspended',
  'disabled',
] as const;
