import { describe, expect, it } from 'vitest';

import { initialPathForClaims } from './middleware';

describe('frontend role and account-state routing', () => {
  it.each([
    ['candidate', '/app/candidato'],
    ['employer', '/app/contratante'],
    ['coordinator', '/app/equipe'],
    ['admin', '/admin'],
  ] as const)('routes active %s users to %s', (role, path) => {
    expect(initialPathForClaims({ role, status: 'active' })).toBe(path);
  });

  it.each(['suspended', 'disabled'] as const)(
    'blocks a %s account before evaluating its role',
    (status) => {
      expect(initialPathForClaims({ role: 'admin', status })).toBe(
        '/conta-indisponivel',
      );
    },
  );

  it('keeps pending employers in their specific onboarding', () => {
    expect(
      initialPathForClaims({ role: 'employer', status: 'pending_email' }),
    ).toBe('/onboarding/contratante');
  });
});
