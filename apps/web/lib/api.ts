import {
  authResponseSchema,
  candidateProfileInputSchema,
  candidateProfileSchema,
  employerProfileInputSchema,
  employerProfileSchema,
  forgotPasswordRequestSchema,
  healthResponseSchema,
  messageResponseSchema,
  profileAssetSchema,
  profileSchema,
  registrationConfigSchema,
  resetPasswordRequestSchema,
  userResponseSchema,
  type AuthResponse,
  type CandidateProfile,
  type CandidateProfileInput,
  type EmployerProfile,
  type EmployerProfileInput,
  type ForgotPasswordRequest,
  type HealthResponse,
  type LoginRequest,
  type MessageResponse,
  type Profile,
  type ProfileAsset,
  type ProfileAssetKind,
  type ProfileVisibility,
  type RegistrationConfig,
  type RegisterRequest,
  type ResetPasswordRequest,
  type UserResponse,
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
