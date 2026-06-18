import {
  authResponseSchema,
  healthResponseSchema,
  userResponseSchema,
  type AuthResponse,
  type HealthResponse,
  type LoginRequest,
  type RegisterRequest,
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
