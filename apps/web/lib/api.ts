import {
  authResponseSchema,
  forgotPasswordRequestSchema,
  healthResponseSchema,
  messageResponseSchema,
  registrationConfigSchema,
  resetPasswordRequestSchema,
  userResponseSchema,
  type AuthResponse,
  type ForgotPasswordRequest,
  type HealthResponse,
  type LoginRequest,
  type MessageResponse,
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
