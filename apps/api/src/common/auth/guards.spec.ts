import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { EmailVerifiedGuard } from './email-verified.guard';
import { RolesGuard } from './roles.guard';
import { TermsGuard } from './terms.guard';

function contextWithUser(user: unknown): ExecutionContext {
  return {
    getClass: () => class Test {},
    getHandler: () => function handler() {},
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('authorization guards', () => {
  it('blocks endpoints when role is not allowed', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn(() => ['admin']),
    } as unknown as Reflector);

    expect(() =>
      guard.canActivate(contextWithUser({ role: 'candidate' })),
    ).toThrow(ForbiddenException);
  });

  it('blocks endpoints that require verified email', () => {
    const guard = new EmailVerifiedGuard({
      getAllAndOverride: jest.fn(() => true),
    } as unknown as Reflector);

    expect(() =>
      guard.canActivate(contextWithUser({ emailVerifiedAt: null })),
    ).toThrow(ForbiddenException);
  });

  it('blocks endpoints when current terms are absent', async () => {
    const guard = new TermsGuard(
      { getAllAndOverride: jest.fn(() => true) } as unknown as Reflector,
      { get: jest.fn((key: string) => key) } as never,
      { hasAcceptedCurrentDocuments: jest.fn(async () => false) } as never,
    );

    await expect(
      guard.canActivate(contextWithUser({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
