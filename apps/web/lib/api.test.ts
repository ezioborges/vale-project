import { describe, expect, it, vi } from 'vitest';

import {
  getApiHealth,
  getMyProfile,
  loginUser,
  saveCandidateProfile,
} from './api';

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

  it('treats an absent current profile as an onboarding state', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(getMyProfile(fetcher)).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/profiles/me'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('validates candidate profile responses and keeps privacy explicit', async () => {
    const now = new Date().toISOString();
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: '2f06cad5-bb33-4d79-badb-d77ab25dfa61',
        kind: 'candidate',
        userId: 'f37a044e-c943-4e3b-8925-dd8dca19a7ce',
        displayName: 'Nome Social',
        pronouns: null,
        headline: 'Desenvolvedora',
        bio: null,
        location: 'Remoto',
        workPreferences: {
          areas: ['Tecnologia'],
          workModes: ['remote'],
          contractTypes: ['clt'],
          availability: null,
        },
        skills: ['TypeScript'],
        experiences: [],
        education: [],
        professionalLinks: [],
        visibility: 'private',
        isActive: true,
        completionPercentage: 63,
        avatar: null,
        resume: null,
        createdAt: now,
        updatedAt: now,
      }),
    });

    const profile = await saveCandidateProfile(
      {
        displayName: 'Nome Social',
        pronouns: null,
        headline: 'Desenvolvedora',
        bio: null,
        location: 'Remoto',
        workPreferences: {
          areas: ['Tecnologia'],
          workModes: ['remote'],
          contractTypes: ['clt'],
          availability: null,
        },
        skills: ['TypeScript'],
        experiences: [],
        education: [],
        professionalLinks: [],
      },
      fetcher,
    );

    expect(profile.visibility).toBe('private');
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/profiles/candidate/me'),
      expect.objectContaining({
        credentials: 'include',
        method: 'PATCH',
      }),
    );
  });
});
