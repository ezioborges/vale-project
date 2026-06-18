import { describe, expect, it, vi } from 'vitest';

import { getApiHealth } from './api';

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
});
