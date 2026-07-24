import { describe, expect, it, vi } from 'vitest';

import { getApiHealth, loginUser } from './api';

describe('getApiHealth', () => {
  it('validates the API health contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        app: 'vale-api',
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
      }),
    });

    await expect(getApiHealth(fetcher)).resolves.toMatchObject({
      app: 'vale-api',
      status: 'ok',
    });
  });

  it('throws when the API responds with an error', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(getApiHealth(fetcher)).rejects.toThrow(
      'API health check failed with status 503',
    );
  });

  it('accepts cookie-only authentication responses without an access token', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        expiresInSeconds: 900,
        user: {
          id: '9d468807-fd6d-4be7-b16d-c067f17c0501',
          displayName: 'Pessoa Candidata',
          email: 'candidate@example.com',
          role: 'candidate',
          status: 'active',
          emailVerifiedAt: new Date().toISOString(),
          initialPath: '/app/candidato',
        },
      }),
    });

    const response = await loginUser(
      { email: 'candidate@example.com', password: 'strong-password' },
      fetcher,
    );

    expect(response).not.toHaveProperty('accessToken');
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
