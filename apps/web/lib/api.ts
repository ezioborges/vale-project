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
  privacySummarySchema,
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
  type PrivacySummary,
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
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type Fetcher = typeof fetch;

export const apiErrorCodes = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'NETWORK_ERROR',
  'INVALID_RESPONSE',
  'CSRF_BOOTSTRAP_FAILED',
] as const;

export type ApiErrorCode = (typeof apiErrorCodes)[number];

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type TransportOptions = {
  authenticated: boolean;
  csrfProtected?: boolean;
  retryOnUnauthorized?: boolean;
};

const csrfTokens = new WeakMap<Fetcher, string>();
const refreshFlights = new WeakMap<Fetcher, Promise<AuthResponse>>();

export function getApiHealth(fetcher?: Fetcher): Promise<HealthResponse> {
  return apiRequest('/health', healthResponseSchema.parse, {}, fetcher, {
    authenticated: false,
  });
}

export function getRegistrationConfig(
  fetcher?: Fetcher,
): Promise<RegistrationConfig> {
  return apiRequest(
    '/auth/registration-config',
    registrationConfigSchema.parse,
    {},
    fetcher,
    { authenticated: false },
  );
}

async function errorFor(response: Response): Promise<ApiRequestError> {
  let message = `API request failed with status ${response.status}`;
  let code = codeForStatus(response.status);
  try {
    const body = (await response.json()) as {
      code?: unknown;
      message?: string | string[];
    };
    if (Array.isArray(body.message)) {
      message = body.message.join(' ');
    } else if (body.message) {
      message = body.message;
    }
    if (
      typeof body.code === 'string' &&
      apiErrorCodes.includes(body.code as ApiErrorCode)
    ) {
      code = body.code as ApiErrorCode;
    }
  } catch {
    // Keep the status-based fallback when the response is not JSON.
  }
  return new ApiRequestError(response.status, code, message);
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 400 || status === 422) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 415) return 'UNSUPPORTED_MEDIA_TYPE';
  if (status === 429) return 'RATE_LIMITED';
  return 'SERVER_ERROR';
}

async function apiRequest<T>(
  path: string,
  parse: (value: unknown) => T,
  init: RequestInit = {},
  fetcher: Fetcher = fetch,
  options: TransportOptions = { authenticated: true },
): Promise<T> {
  const response = await transport(path, init, fetcher, options);
  if (!response.ok) throw await errorFor(response);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiRequestError(
      response.status,
      'INVALID_RESPONSE',
      'A API retornou uma resposta inválida.',
    );
  }

  try {
    return parse(body);
  } catch {
    throw new ApiRequestError(
      response.status,
      'INVALID_RESPONSE',
      'A resposta da API não corresponde ao contrato esperado.',
    );
  }
}

async function transport(
  path: string,
  init: RequestInit,
  fetcher: Fetcher,
  options: TransportOptions,
  retried = false,
): Promise<Response> {
  const response = await send(path, init, fetcher, options);

  if (response.status !== 401 || !options.authenticated) {
    return response;
  }

  if (!retried && options.retryOnUnauthorized !== false) {
    await refreshSingleFlight(fetcher);
    return transport(path, init, fetcher, options, true);
  }

  const error = await errorFor(response);
  endSession(fetcher, error);
  throw error;
}

async function send(
  path: string,
  init: RequestInit,
  fetcher: Fetcher,
  options: TransportOptions,
): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (
    unsafeMethods.has(method) &&
    (options.authenticated || options.csrfProtected)
  ) {
    headers.set('X-CSRF-Token', await csrfTokenFor(fetcher));
  }

  try {
    const response = await fetcher(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      ...init,
      headers,
    });
    rememberCsrfToken(fetcher, response);
    return response;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Não foi possível alcançar a API.',
    );
  }
}

function refreshSingleFlight(fetcher: Fetcher): Promise<AuthResponse> {
  const current = refreshFlights.get(fetcher);
  if (current) return current;

  const tracked = performRefresh(fetcher)
    .catch((error: unknown) => {
      const sessionError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError(
              0,
              'NETWORK_ERROR',
              'Não foi possível renovar a sessão.',
            );
      endSession(fetcher, sessionError);
      throw sessionError;
    })
    .finally(() => {
      refreshFlights.delete(fetcher);
    });
  refreshFlights.set(fetcher, tracked);
  return tracked;
}

async function performRefresh(fetcher: Fetcher): Promise<AuthResponse> {
  const response = await send(
    '/auth/refresh',
    { body: JSON.stringify({}), method: 'POST' },
    fetcher,
    { authenticated: false, csrfProtected: true },
  );
  if (!response.ok) throw await errorFor(response);

  try {
    return authResponseSchema.parse(await response.json());
  } catch {
    throw new ApiRequestError(
      response.status,
      'INVALID_RESPONSE',
      'A renovação da sessão retornou uma resposta inválida.',
    );
  }
}

function endSession(fetcher: Fetcher, error: ApiRequestError): void {
  csrfTokens.delete(fetcher);
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('vale:session-ended', {
      detail: { code: error.code, status: error.status },
    }),
  );
  const target =
    error.status === 403 ? '/conta-indisponivel' : '/?sessao=expirada';
  if (`${window.location.pathname}${window.location.search}` !== target) {
    window.location.replace(target);
  }
}

export function registerUser(
  input: RegisterRequest,
  fetcher?: Fetcher,
): Promise<AuthResponse> {
  return apiRequest(
    '/auth/register',
    authResponseSchema.parse,
    { body: JSON.stringify(input), method: 'POST' },
    fetcher,
    { authenticated: false },
  );
}

export function loginUser(
  input: LoginRequest,
  fetcher?: Fetcher,
): Promise<AuthResponse> {
  return apiRequest(
    '/auth/login',
    authResponseSchema.parse,
    { body: JSON.stringify(input), method: 'POST' },
    fetcher,
    { authenticated: false },
  );
}

export function refreshSession(fetcher?: Fetcher): Promise<AuthResponse> {
  return refreshSingleFlight(fetcher ?? fetch);
}

export function verifyEmail(
  token: string,
  fetcher?: Fetcher,
): Promise<UserResponse> {
  return apiRequest(
    '/auth/verify-email',
    userResponseSchema.parse,
    { body: JSON.stringify({ token }), method: 'POST' },
    fetcher,
    { authenticated: false },
  );
}

export function forgotPassword(
  input: ForgotPasswordRequest,
  fetcher?: Fetcher,
): Promise<MessageResponse> {
  return apiRequest(
    '/auth/forgot-password',
    messageResponseSchema.parse,
    {
      body: JSON.stringify(forgotPasswordRequestSchema.parse(input)),
      method: 'POST',
    },
    fetcher,
    { authenticated: false },
  );
}

export function resetPassword(
  input: ResetPasswordRequest,
  fetcher?: Fetcher,
): Promise<MessageResponse> {
  return apiRequest(
    '/auth/reset-password',
    messageResponseSchema.parse,
    {
      body: JSON.stringify(resetPasswordRequestSchema.parse(input)),
      method: 'POST',
    },
    fetcher,
    { authenticated: false },
  );
}

export function requestEmailVerification(
  fetcher?: Fetcher,
): Promise<MessageResponse> {
  return apiRequest(
    '/auth/email-verification',
    messageResponseSchema.parse,
    { body: JSON.stringify({}), method: 'POST' },
    fetcher,
  );
}

export async function logoutUser(fetcher: Fetcher = fetch): Promise<void> {
  const response = await transport(
    '/auth/logout',
    { body: JSON.stringify({}), method: 'POST' },
    fetcher,
    { authenticated: true, retryOnUnauthorized: false },
  );

  if (!response.ok && response.status !== 204) {
    throw await errorFor(response);
  }
  csrfTokens.delete(fetcher);
}

export function getCurrentUser(fetcher?: Fetcher): Promise<UserResponse> {
  return apiRequest('/users/me', userResponseSchema.parse, {}, fetcher);
}

export function getPrivacySummary(fetcher?: Fetcher): Promise<PrivacySummary> {
  return apiRequest(
    '/privacy/summary',
    privacySummarySchema.parse,
    {},
    fetcher,
  );
}

export async function getMyProfile(
  fetcher: Fetcher = fetch,
): Promise<Profile | null> {
  const response = await transport('/profiles/me', {}, fetcher, {
    authenticated: true,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw await errorFor(response);
  try {
    return profileSchema.parse(await response.json());
  } catch {
    throw new ApiRequestError(
      response.status,
      'INVALID_RESPONSE',
      'A resposta de perfil não corresponde ao contrato esperado.',
    );
  }
}

export function saveCandidateProfile(
  input: CandidateProfileInput,
  fetcher?: Fetcher,
): Promise<CandidateProfile> {
  return apiRequest(
    '/profiles/candidate/me',
    candidateProfileSchema.parse,
    {
      body: JSON.stringify(candidateProfileInputSchema.parse(input)),
      method: 'PATCH',
    },
    fetcher,
  );
}

export function saveEmployerProfile(
  input: EmployerProfileInput,
  fetcher?: Fetcher,
): Promise<EmployerProfile> {
  return apiRequest(
    '/profiles/employer/me',
    employerProfileSchema.parse,
    {
      body: JSON.stringify(employerProfileInputSchema.parse(input)),
      method: 'PATCH',
    },
    fetcher,
  );
}

export function updateCandidateVisibility(
  visibility: ProfileVisibility,
  fetcher?: Fetcher,
): Promise<CandidateProfile> {
  return apiRequest(
    '/profiles/candidate/me/visibility',
    candidateProfileSchema.parse,
    {
      body: JSON.stringify({ visibility }),
      method: 'PATCH',
    },
    fetcher,
  );
}

export function updateCandidateActivation(
  isActive: boolean,
  fetcher?: Fetcher,
): Promise<CandidateProfile> {
  return apiRequest(
    '/profiles/candidate/me/activation',
    candidateProfileSchema.parse,
    {
      body: JSON.stringify({ isActive }),
      method: 'PATCH',
    },
    fetcher,
  );
}

export function uploadProfileFile(
  kind: ProfileAssetKind,
  file: File,
  fetcher?: Fetcher,
): Promise<ProfileAsset> {
  const body = new FormData();
  body.set('kind', kind);
  body.set('file', file);
  return apiRequest(
    '/profiles/files',
    profileAssetSchema.parse,
    { body, method: 'POST' },
    fetcher,
  );
}

export async function deleteProfileFile(
  assetId: string,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const response = await transport(
    `/profiles/files/${encodeURIComponent(assetId)}`,
    { method: 'DELETE' },
    fetcher,
    { authenticated: true },
  );
  if (!response.ok) throw await errorFor(response);
}

export async function downloadProfileFile(
  asset: ProfileAsset,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const response = await transport(asset.downloadPath, {}, fetcher, {
    authenticated: true,
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

function idempotencyKey(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 18)}`;
}

async function csrfTokenFor(fetcher: Fetcher): Promise<string> {
  const cookieToken = csrfTokenFromDocument();
  if (cookieToken) {
    csrfTokens.set(fetcher, cookieToken);
    return cookieToken;
  }

  const cached = csrfTokens.get(fetcher);
  if (cached && typeof document === 'undefined') {
    return cached;
  }

  let response: Response;
  try {
    response = await fetcher(`${apiBaseUrl}/auth/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiRequestError(
      0,
      'CSRF_BOOTSTRAP_FAILED',
      'Não foi possível inicializar a proteção CSRF.',
    );
  }
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      'CSRF_BOOTSTRAP_FAILED',
      `CSRF bootstrap failed with status ${response.status}`,
    );
  }

  let body: { csrfToken?: unknown };
  try {
    body = (await response.json()) as { csrfToken?: unknown };
  } catch {
    throw new ApiRequestError(
      response.status,
      'INVALID_RESPONSE',
      'CSRF bootstrap returned an invalid response.',
    );
  }
  if (typeof body.csrfToken !== 'string' || body.csrfToken.length < 32) {
    throw new ApiRequestError(
      response.status,
      'INVALID_RESPONSE',
      'CSRF bootstrap returned an invalid token.',
    );
  }
  csrfTokens.set(fetcher, body.csrfToken);
  return body.csrfToken;
}

function rememberCsrfToken(fetcher: Fetcher, response: Response): void {
  const token = response.headers?.get?.('X-CSRF-Token');
  if (token) {
    csrfTokens.set(fetcher, token);
  }
}

function csrfTokenFromDocument(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const names = ['__Host-vale_csrf_token', 'vale_csrf_token'];
  for (const part of document.cookie.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName && names.includes(rawName)) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return undefined;
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
    { authenticated: false },
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
    { authenticated: false },
  );
}

export function createJob(
  input: JobInput,
  fetcher?: Fetcher,
): Promise<ManagedJob> {
  return apiRequest(
    '/jobs',
    managedJobSchema.parse,
    {
      body: JSON.stringify(input),
      headers: { 'Idempotency-Key': idempotencyKey() },
      method: 'POST',
    },
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
    {
      body: JSON.stringify({ coverMessage }),
      headers: { 'Idempotency-Key': idempotencyKey() },
      method: 'POST',
    },
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
  const response = await transport(
    `/applications/${encodeURIComponent(applicationId)}/resume`,
    {},
    fetcher,
    { authenticated: true },
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
