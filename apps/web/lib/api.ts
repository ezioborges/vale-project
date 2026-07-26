import {
  authResponseSchema,
  adminUserPageSchema,
  auditEventPageSchema,
  candidateProfileInputSchema,
  candidateProfileSchema,
  createReportSchema,
  candidateApplicationPageSchema,
  candidateApplicationSchema,
  employerProfileInputSchema,
  employerProfileSchema,
  forgotPasswordRequestSchema,
  healthResponseSchema,
  messageResponseSchema,
  managedJobPageSchema,
  managedJobSchema,
  moderationReportPageSchema,
  moderationReportSchema,
  myReportPageSchema,
  myReportSchema,
  profileAssetSchema,
  profileSchema,
  publicJobPageSchema,
  publicJobSchema,
  receivedApplicationPageSchema,
  receivedApplicationSchema,
  registrationConfigSchema,
  resetPasswordRequestSchema,
  userResponseSchema,
  type AuthResponse,
  type AdminUserPage,
  type AuditEventPage,
  type CandidateProfile,
  type CandidateProfileInput,
  type CandidateApplication,
  type CandidateApplicationPage,
  type EmployerProfile,
  type EmployerProfileInput,
  type ForgotPasswordRequest,
  type HealthResponse,
  type LoginRequest,
  type MessageResponse,
  type ManagedJob,
  type ManagedJobPage,
  type ModerationReport,
  type ModerationReportPage,
  type MyReport,
  type MyReportPage,
  type Profile,
  type ProfileAsset,
  type ProfileAssetKind,
  type ProfileVisibility,
  type PublicJob,
  type PublicJobPage,
  type ReceivedApplication,
  type ReceivedApplicationPage,
  type RegistrationConfig,
  type RegisterRequest,
  type ResetPasswordRequest,
  type ReportDecisionAction,
  type ReportPriority,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
  type ApplicationStatus,
  type ContractType,
  type JobInput,
  type JobModerationDecision,
  type JobSeniority,
  type JobStatus,
  type WorkMode,
  type UserResponse,
  type UserRole,
  type UserStatus,
} from '@vale/shared';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function getApiHealth(
  fetcher: typeof fetch = fetch,
): Promise<HealthResponse> {
  const response = await fetcher(`${apiBaseUrl}/health`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API health check failed with status ${response.status}`);
  }

  return healthResponseSchema.parse(await response.json());
}

export async function getRegistrationConfig(
  fetcher: typeof fetch = fetch,
): Promise<RegistrationConfig> {
  const response = await fetcher(`${apiBaseUrl}/auth/registration-config`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Registration config failed with status ${response.status}`,
    );
  }

  return registrationConfigSchema.parse(await response.json());
}

type Fetcher = typeof fetch;

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function errorFor(response: Response): Promise<ApiRequestError> {
  let message = `API request failed with status ${response.status}`;
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      message = body.message.join(' ');
    } else if (body.message) {
      message = body.message;
    }
  } catch {
    // Keep the status-based fallback when the response is not JSON.
  }
  return new ApiRequestError(response.status, message);
}

async function apiJson<TInput extends object, TOutput>(
  path: string,
  body: TInput,
  parse: (value: unknown) => TOutput,
  fetcher: Fetcher = fetch,
): Promise<TOutput> {
  const response = await fetcher(`${apiBaseUrl}${path}`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return parse(await response.json());
}

export function registerUser(
  input: RegisterRequest,
  fetcher?: Fetcher,
): Promise<AuthResponse> {
  return apiJson('/auth/register', input, authResponseSchema.parse, fetcher);
}

export function loginUser(
  input: LoginRequest,
  fetcher?: Fetcher,
): Promise<AuthResponse> {
  return apiJson('/auth/login', input, authResponseSchema.parse, fetcher);
}

export function refreshSession(fetcher?: Fetcher): Promise<AuthResponse> {
  return apiJson('/auth/refresh', {}, authResponseSchema.parse, fetcher);
}

export function verifyEmail(
  token: string,
  fetcher?: Fetcher,
): Promise<UserResponse> {
  return apiJson(
    '/auth/verify-email',
    { token },
    userResponseSchema.parse,
    fetcher,
  );
}

export function forgotPassword(
  input: ForgotPasswordRequest,
  fetcher?: Fetcher,
): Promise<MessageResponse> {
  return apiJson(
    '/auth/forgot-password',
    forgotPasswordRequestSchema.parse(input),
    messageResponseSchema.parse,
    fetcher,
  );
}

export function resetPassword(
  input: ResetPasswordRequest,
  fetcher?: Fetcher,
): Promise<MessageResponse> {
  return apiJson(
    '/auth/reset-password',
    resetPasswordRequestSchema.parse(input),
    messageResponseSchema.parse,
    fetcher,
  );
}

export async function requestEmailVerification(
  fetcher: Fetcher = fetch,
): Promise<MessageResponse> {
  const response = await fetcher(`${apiBaseUrl}/auth/email-verification`, {
    body: JSON.stringify({}),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(
      `Email verification request failed with status ${response.status}`,
    );
  }

  return messageResponseSchema.parse(await response.json());
}

export async function logoutUser(fetcher: Fetcher = fetch): Promise<void> {
  const response = await fetcher(`${apiBaseUrl}/auth/logout`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`API logout failed with status ${response.status}`);
  }
}

export async function getCurrentUser(
  fetcher: Fetcher = fetch,
): Promise<UserResponse> {
  const response = await fetcher(`${apiBaseUrl}/users/me`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await errorFor(response);
  return userResponseSchema.parse(await response.json());
}

export async function getMyProfile(
  fetcher: Fetcher = fetch,
): Promise<Profile | null> {
  const response = await fetcher(`${apiBaseUrl}/profiles/me`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw await errorFor(response);
  return profileSchema.parse(await response.json());
}

export async function saveCandidateProfile(
  input: CandidateProfileInput,
  fetcher: Fetcher = fetch,
): Promise<CandidateProfile> {
  const response = await fetcher(`${apiBaseUrl}/profiles/candidate/me`, {
    body: JSON.stringify(candidateProfileInputSchema.parse(input)),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  });
  if (!response.ok) throw await errorFor(response);
  return candidateProfileSchema.parse(await response.json());
}

export async function saveEmployerProfile(
  input: EmployerProfileInput,
  fetcher: Fetcher = fetch,
): Promise<EmployerProfile> {
  const response = await fetcher(`${apiBaseUrl}/profiles/employer/me`, {
    body: JSON.stringify(employerProfileInputSchema.parse(input)),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  });
  if (!response.ok) throw await errorFor(response);
  return employerProfileSchema.parse(await response.json());
}

export async function updateCandidateVisibility(
  visibility: ProfileVisibility,
  fetcher: Fetcher = fetch,
): Promise<CandidateProfile> {
  const response = await fetcher(
    `${apiBaseUrl}/profiles/candidate/me/visibility`,
    {
      body: JSON.stringify({ visibility }),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    },
  );
  if (!response.ok) throw await errorFor(response);
  return candidateProfileSchema.parse(await response.json());
}

export async function updateCandidateActivation(
  isActive: boolean,
  fetcher: Fetcher = fetch,
): Promise<CandidateProfile> {
  const response = await fetcher(
    `${apiBaseUrl}/profiles/candidate/me/activation`,
    {
      body: JSON.stringify({ isActive }),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    },
  );
  if (!response.ok) throw await errorFor(response);
  return candidateProfileSchema.parse(await response.json());
}

export async function uploadProfileFile(
  kind: ProfileAssetKind,
  file: File,
  fetcher: Fetcher = fetch,
): Promise<ProfileAsset> {
  const body = new FormData();
  body.set('kind', kind);
  body.set('file', file);
  const response = await fetcher(`${apiBaseUrl}/profiles/files`, {
    body,
    credentials: 'include',
    headers: { Accept: 'application/json' },
    method: 'POST',
  });
  if (!response.ok) throw await errorFor(response);
  return profileAssetSchema.parse(await response.json());
}

export async function deleteProfileFile(
  assetId: string,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const response = await fetcher(`${apiBaseUrl}/profiles/files/${assetId}`, {
    credentials: 'include',
    method: 'DELETE',
  });
  if (!response.ok) throw await errorFor(response);
}

export async function downloadProfileFile(
  asset: ProfileAsset,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const response = await fetcher(`${apiBaseUrl}${asset.downloadPath}`, {
    credentials: 'include',
  });
  if (!response.ok) throw await errorFor(response);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = asset.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type JobSearchParams = {
  q?: string;
  area?: string;
  location?: string;
  workMode?: WorkMode;
  contractType?: ContractType;
  seniority?: JobSeniority;
  page?: number;
  limit?: number;
};

function queryString(
  input: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const result = params.toString();
  return result ? `?${result}` : '';
}

async function apiRequest<T>(
  path: string,
  parse: (value: unknown) => T,
  init: RequestInit = {},
  fetcher: Fetcher = fetch,
): Promise<T> {
  const response = await fetcher(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) throw await errorFor(response);
  return parse(await response.json());
}

export function searchJobs(
  params: JobSearchParams = {},
  fetcher?: Fetcher,
): Promise<PublicJobPage> {
  return apiRequest(
    `/jobs${queryString(params)}`,
    publicJobPageSchema.parse,
    {},
    fetcher,
  );
}

export function getPublicJob(
  jobId: string,
  fetcher?: Fetcher,
): Promise<PublicJob> {
  return apiRequest(
    `/jobs/${encodeURIComponent(jobId)}`,
    publicJobSchema.parse,
    {},
    fetcher,
  );
}

export function createJob(
  input: JobInput,
  fetcher?: Fetcher,
): Promise<ManagedJob> {
  return apiRequest(
    '/jobs',
    managedJobSchema.parse,
    { body: JSON.stringify(input), method: 'POST' },
    fetcher,
  );
}

export function updateJob(
  jobId: string,
  input: JobInput,
  fetcher?: Fetcher,
): Promise<ManagedJob> {
  return apiRequest(
    `/jobs/mine/${encodeURIComponent(jobId)}`,
    managedJobSchema.parse,
    { body: JSON.stringify(input), method: 'PATCH' },
    fetcher,
  );
}

export function listMyJobs(
  page = 1,
  fetcher?: Fetcher,
): Promise<ManagedJobPage> {
  return apiRequest(
    `/jobs/mine${queryString({ page, limit: 20 })}`,
    managedJobPageSchema.parse,
    {},
    fetcher,
  );
}

export function transitionJob(
  jobId: string,
  action: 'pause' | 'resume' | 'close' | 'republish',
  fetcher?: Fetcher,
): Promise<ManagedJob> {
  return apiRequest(
    `/jobs/mine/${encodeURIComponent(jobId)}/${action}`,
    managedJobSchema.parse,
    { method: 'POST' },
    fetcher,
  );
}

export function listModerationJobs(
  status: JobStatus = 'pending_review',
  page = 1,
  fetcher?: Fetcher,
): Promise<ManagedJobPage> {
  return apiRequest(
    `/moderation/jobs${queryString({ status, page, limit: 20 })}`,
    managedJobPageSchema.parse,
    {},
    fetcher,
  );
}

export function decideJob(
  jobId: string,
  decision: JobModerationDecision,
  reason?: string,
  fetcher?: Fetcher,
): Promise<ManagedJob> {
  return apiRequest(
    `/moderation/jobs/${encodeURIComponent(jobId)}/decision`,
    managedJobSchema.parse,
    {
      body: JSON.stringify({ decision, ...(reason ? { reason } : {}) }),
      method: 'POST',
    },
    fetcher,
  );
}

export function submitApplication(
  jobId: string,
  coverMessage: string | null,
  fetcher?: Fetcher,
): Promise<CandidateApplication> {
  return apiRequest(
    `/jobs/${encodeURIComponent(jobId)}/applications`,
    candidateApplicationSchema.parse,
    { body: JSON.stringify({ coverMessage }), method: 'POST' },
    fetcher,
  );
}

export function listMyApplications(
  status?: ApplicationStatus,
  fetcher?: Fetcher,
): Promise<CandidateApplicationPage> {
  return apiRequest(
    `/applications/mine${queryString({ status, page: 1, limit: 30 })}`,
    candidateApplicationPageSchema.parse,
    {},
    fetcher,
  );
}

export function cancelApplication(
  applicationId: string,
  fetcher?: Fetcher,
): Promise<CandidateApplication> {
  return apiRequest(
    `/applications/mine/${encodeURIComponent(applicationId)}/cancel`,
    candidateApplicationSchema.parse,
    { method: 'POST' },
    fetcher,
  );
}

export function listReceivedApplications(
  jobId: string,
  status?: ApplicationStatus,
  fetcher?: Fetcher,
): Promise<ReceivedApplicationPage> {
  return apiRequest(
    `/jobs/mine/${encodeURIComponent(jobId)}/applications${queryString({
      status,
      page: 1,
      limit: 30,
    })}`,
    receivedApplicationPageSchema.parse,
    {},
    fetcher,
  );
}

export function updateApplicationStatus(
  applicationId: string,
  status: 'under_review' | 'shortlisted' | 'rejected',
  fetcher?: Fetcher,
): Promise<ReceivedApplication> {
  return apiRequest(
    `/applications/${encodeURIComponent(applicationId)}/status`,
    receivedApplicationSchema.parse,
    { body: JSON.stringify({ status }), method: 'PATCH' },
    fetcher,
  );
}

export async function downloadApplicationResume(
  applicationId: string,
  fileName: string,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const response = await fetcher(
    `${apiBaseUrl}/applications/${encodeURIComponent(applicationId)}/resume`,
    { credentials: 'include' },
  );
  if (!response.ok) throw await errorFor(response);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function createReport(
  input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description: string;
  },
  fetcher?: Fetcher,
): Promise<MyReport> {
  return apiRequest(
    '/reports',
    myReportSchema.parse,
    {
      body: JSON.stringify(createReportSchema.parse(input)),
      method: 'POST',
    },
    fetcher,
  );
}

export function listMyReports(
  status?: ReportStatus,
  fetcher?: Fetcher,
): Promise<MyReportPage> {
  return apiRequest(
    `/reports/mine${queryString({ status, page: 1, limit: 30 })}`,
    myReportPageSchema.parse,
    {},
    fetcher,
  );
}

export function listModerationReports(
  filters: {
    status?: ReportStatus;
    priority?: ReportPriority;
    targetType?: ReportTargetType;
  } = {},
  fetcher?: Fetcher,
): Promise<ModerationReportPage> {
  return apiRequest(
    `/moderation/reports${queryString({
      ...filters,
      page: 1,
      limit: 30,
    })}`,
    moderationReportPageSchema.parse,
    {},
    fetcher,
  );
}

export function updateReportPriority(
  reportId: string,
  priority: ReportPriority,
  fetcher?: Fetcher,
): Promise<ModerationReport> {
  return apiRequest(
    `/moderation/reports/${encodeURIComponent(reportId)}/priority`,
    moderationReportSchema.parse,
    { body: JSON.stringify({ priority }), method: 'PATCH' },
    fetcher,
  );
}

export function decideReport(
  reportId: string,
  action: ReportDecisionAction,
  reason: string,
  fetcher?: Fetcher,
): Promise<ModerationReport> {
  return apiRequest(
    `/moderation/reports/${encodeURIComponent(reportId)}/decision`,
    moderationReportSchema.parse,
    { body: JSON.stringify({ action, reason }), method: 'POST' },
    fetcher,
  );
}

export function listAdminUsers(
  filters: {
    q?: string;
    role?: UserRole;
    status?: UserStatus;
  } = {},
  fetcher?: Fetcher,
): Promise<AdminUserPage> {
  return apiRequest(
    `/users${queryString({ ...filters, page: 1, limit: 30 })}`,
    adminUserPageSchema.parse,
    {},
    fetcher,
  );
}

export function updateAdminUserRole(
  userId: string,
  role: UserRole,
  reason: string,
  fetcher?: Fetcher,
): Promise<UserResponse> {
  return apiRequest(
    `/users/${encodeURIComponent(userId)}/role`,
    userResponseSchema.parse,
    { body: JSON.stringify({ role, reason }), method: 'PATCH' },
    fetcher,
  );
}

export function updateAdminUserStatus(
  userId: string,
  status: Exclude<UserStatus, 'pending_email'>,
  reason: string,
  fetcher?: Fetcher,
): Promise<UserResponse> {
  return apiRequest(
    `/users/${encodeURIComponent(userId)}/status`,
    userResponseSchema.parse,
    { body: JSON.stringify({ status, reason }), method: 'PATCH' },
    fetcher,
  );
}

export function listAuditEvents(
  filters: {
    action?: string;
    actorUserId?: string;
    targetUserId?: string;
    from?: string;
    to?: string;
  } = {},
  fetcher?: Fetcher,
): Promise<AuditEventPage> {
  return apiRequest(
    `/audit-events${queryString({ ...filters, page: 1, limit: 40 })}`,
    auditEventPageSchema.parse,
    {},
    fetcher,
  );
}
