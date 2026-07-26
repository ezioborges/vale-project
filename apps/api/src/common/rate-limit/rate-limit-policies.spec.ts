import { AuthController } from '../../auth/auth.controller';
import { ApplicationsController } from '../../jobs/applications.controller';
import { JobsController } from '../../jobs/jobs.controller';
import { ProfilesController } from '../../profiles/profiles.controller';
import { ReportsController } from '../../reports/reports.controller';
import { RATE_LIMIT_KEY, RateLimitPolicy } from './rate-limit.decorator';

describe('composed rate-limit policies', () => {
  it.each([
    [AuthController.prototype.login, 'auth:login', ['ip', 'target']],
    [AuthController.prototype.register, 'auth:register', ['ip', 'target']],
    [AuthController.prototype.refresh, 'auth:refresh', ['ip', 'family']],
    [
      AuthController.prototype.forgotPassword,
      'auth:forgot-password',
      ['ip', 'target'],
    ],
    [ReportsController.prototype.create, 'reports:create', ['user', 'target']],
    [
      ProfilesController.prototype.uploadFile,
      'profiles:upload',
      ['requests', 'volume'],
    ],
    [JobsController.prototype.search, 'jobs:public-search', ['ip']],
    [
      ApplicationsController.prototype.downloadResume,
      'applications:resume-download',
      ['user-purpose'],
    ],
  ] as const)('configures %s', (handler, name, bucketNames) => {
    const policy = Reflect.getMetadata(
      RATE_LIMIT_KEY,
      handler,
    ) as RateLimitPolicy;

    expect(policy.name).toBe(name);
    expect(policy.buckets.map((bucket) => bucket.name)).toEqual(bucketNames);
    expect(
      policy.buckets.every(
        (bucket) =>
          bucket.limit > 0 &&
          bucket.windowSeconds > 0 &&
          bucket.identities.length > 0,
      ),
    ).toBe(true);
  });
});
