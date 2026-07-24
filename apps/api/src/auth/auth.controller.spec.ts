import { RATE_LIMIT_KEY } from '../common/rate-limit/rate-limit.decorator';
import { AuthController } from './auth.controller';

describe('AuthController rate-limit policies', () => {
  it.each([
    ['register', 'auth:register'],
    ['login', 'auth:login'],
    ['refresh', 'auth:refresh'],
    ['verifyEmail', 'auth:verify-email'],
    ['requestEmailVerification', 'auth:email-verification'],
    ['forgotPassword', 'auth:forgot-password'],
    ['resetPassword', 'auth:reset-password'],
  ] as const)('protects %s with policy %s', (method, policyName) => {
    const policy = Reflect.getMetadata(
      RATE_LIMIT_KEY,
      AuthController.prototype[method],
    ) as { name?: string } | undefined;

    expect(policy?.name).toBe(policyName);
  });
});
