import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { RefreshToken } from '../../auth/refresh-token.entity';
import { Env } from '../config/env.validation';
import { RateLimitCounter } from './rate-limit-counter.entity';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  const counters = {
    delete: jest.fn(),
    query: jest.fn(),
  };
  const refreshTokens = {
    findOne: jest.fn(),
  };
  const config = {
    get: jest.fn(() => 300),
  };
  const service = new RateLimitService(
    counters as unknown as Repository<RateLimitCounter>,
    refreshTokens as unknown as Repository<RefreshToken>,
    config as unknown as ConfigService<Env, true>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    counters.query.mockResolvedValue([{ hits: 3 }]);
    counters.delete.mockResolvedValue({ affected: 2 });
  });

  it('increments a hashed bucket atomically without global cleanup', async () => {
    const result = await service.consume({
      identity: 'email:victim@example.com',
      policyName: 'auth:login:target',
      limit: 10,
      windowSeconds: 300,
      cost: 2,
    });

    expect(result).toMatchObject({ allowed: true, remaining: 7 });
    expect(counters.delete).not.toHaveBeenCalled();
    expect(counters.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT'),
      [expect.not.stringContaining('victim@example.com'), 2, expect.any(Date)],
    );
  });

  it('cleans expired buckets only through periodic maintenance', async () => {
    const now = new Date('2026-07-26T12:00:00.000Z');

    await expect(service.cleanupExpired(now)).resolves.toBe(2);
    expect(counters.delete).toHaveBeenCalledWith({
      expiresAt: expect.anything(),
    });
  });

  it('resolves a rotating refresh token to its stable family', async () => {
    refreshTokens.findOne.mockResolvedValue({
      familyId: 'ce1305bf-1668-498e-8279-4a966bd9bc80',
    });

    await expect(service.resolveRefreshFamily('opaque-token')).resolves.toBe(
      'ce1305bf-1668-498e-8279-4a966bd9bc80',
    );
    expect(refreshTokens.findOne).toHaveBeenCalledWith({
      select: { familyId: true },
      where: { tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    });
  });

  it('returns a stable error contract when a weighted budget is exhausted', async () => {
    counters.query.mockResolvedValue([{ hits: 251 }]);

    await expect(
      service.enforce({
        identity: 'user:id:purpose:resume',
        policyName: 'profiles:download:volume',
        limit: 250,
        windowSeconds: 86_400,
        cost: 5,
      }),
    ).rejects.toMatchObject({
      retryAfterSeconds: expect.any(Number),
    });
  });
});
