import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export type RateLimitIdentity =
  | 'ip'
  | 'user'
  | 'refreshFamily'
  | { body: string; normalize?: 'email' | 'lowercase' }
  | { param: string; normalize?: 'lowercase' }
  | { static: string };

export type RateLimitBucket = {
  name: string;
  identities: RateLimitIdentity[];
  limit: number;
  windowSeconds: number;
  cost?: 'request' | 'contentLengthMiB';
};

export type RateLimitPolicy = {
  name: string;
  buckets: RateLimitBucket[];
};

export const RateLimit = (policy: RateLimitPolicy) =>
  SetMetadata(RATE_LIMIT_KEY, policy);
