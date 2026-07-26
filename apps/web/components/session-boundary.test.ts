import type { UserResponse } from '@vale/shared';
import { describe, expect, it } from 'vitest';

import { trustedRedirectFor } from './session-boundary';

describe('trusted protected-route decisions', () => {
  it('keeps each active role in its API-authorized area', () => {
    expect(
      trustedRedirectFor(user({ role: 'candidate' }), '/app/candidato'),
    ).toBeNull();
    expect(
      trustedRedirectFor(user({ role: 'admin' }), '/app/equipe/moderacao'),
    ).toBeNull();
  });

  it('redirects role changes from stale frontend routes', () => {
    expect(
      trustedRedirectFor(user({ role: 'coordinator' }), '/app/candidato'),
    ).toBe('/app/equipe');
  });

  it('uses the backend-provided path for non-active accounts', () => {
    expect(
      trustedRedirectFor(
        user({
          initialPath: '/conta-indisponivel',
          status: 'suspended',
        }),
        '/admin',
      ),
    ).toBe('/conta-indisponivel');
  });
});

function user(overrides: Partial<UserResponse>): UserResponse {
  const role = overrides.role ?? 'candidate';
  const initialPaths = {
    admin: '/admin',
    coordinator: '/app/equipe',
    employer: '/app/contratante',
    candidate: '/app/candidato',
  } as const;
  return {
    id: '9d468807-fd6d-4be7-b16d-c067f17c0501',
    displayName: 'Pessoa',
    email: 'pessoa@example.com',
    role,
    status: 'active',
    emailVerifiedAt: new Date().toISOString(),
    initialPath: initialPaths[role],
    ...overrides,
  };
}
