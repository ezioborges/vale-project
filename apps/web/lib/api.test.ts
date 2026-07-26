import { describe, expect, it, vi } from 'vitest';

import {
  createReport,
  getApiHealth,
  getMyProfile,
  listAuditEvents,
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
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          csrfToken:
            'test-csrf-token-with-at-least-thirty-two-characters.signature',
        }),
      })
      .mockResolvedValueOnce({
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
    const profileRequest = fetcher.mock.calls[1]?.[1];
    expect(
      (profileRequest?.headers as Record<string, string>)['X-CSRF-Token'],
    ).toContain('test-csrf-token');
  });

  it('validates a report before sending sensitive text', async () => {
    const fetcher = vi.fn();

    expect(() =>
      createReport(
        {
          targetType: 'job',
          targetId: '55db8067-8865-4ad0-b88e-47d8c2cfa5d5',
          reason: 'privacy',
          description: 'curto',
        },
        fetcher,
      ),
    ).toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('keeps the audit client response on the public allowlist', async () => {
    const now = new Date().toISOString();
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        items: [
          {
            id: 'a2d91539-f38d-4ca3-bc95-c4221b89d521',
            actorUserId: '4a5021bd-e795-43f2-93a8-1bf1cfd0b846',
            targetUserId: 'a91f45dd-12db-47d4-a567-85c46b7e8ff9',
            action: 'report.decision_recorded',
            context: { reportId: 'afe0e098-f714-453a-a5cc-ddc52be8c065' },
            ipAddress: '127.0.0.1',
            userAgent: 'private-agent',
            createdAt: now,
          },
        ],
        page: 1,
        limit: 40,
        total: 1,
        totalPages: 1,
      }),
    });

    const result = await listAuditEvents({}, fetcher);

    expect(result.items[0]).not.toHaveProperty('ipAddress');
    expect(result.items[0]).not.toHaveProperty('userAgent');
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/audit-events?page=1&limit=40'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
