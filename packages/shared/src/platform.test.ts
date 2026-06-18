import { describe, expect, it } from 'vitest';

import { publicRegistrationRoles, userRoles } from './platform';
import { authResponseSchema, healthResponseSchema } from './schemas';

describe('shared platform contracts', () => {
  it('keeps public user roles explicit', () => {
    expect(userRoles).toEqual([
      'admin',
      'coordinator',
      'employer',
      'candidate',
    ]);
    expect(publicRegistrationRoles).toEqual(['employer', 'candidate']);
  });

  it('validates the health response contract', () => {
    expect(() =>
      healthResponseSchema.parse({
        app: 'vale-api',
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
      }),
    ).not.toThrow();
  });

  it('validates the auth response contract', () => {
    expect(() =>
      authResponseSchema.parse({
        accessToken: 'access-token',
        expiresInSeconds: 900,
        user: {
          id: '9b6bd21a-626b-4a43-84a7-6edcc5728426',
          email: 'candidate@example.com',
          role: 'candidate',
          status: 'pending_email',
          emailVerifiedAt: null,
        },
      }),
    ).not.toThrow();
  });
});
