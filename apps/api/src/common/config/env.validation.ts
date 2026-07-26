import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const LOCAL_DEFAULTS = {
  API_CORS_ORIGIN: 'http://localhost:3000',
  WEB_APP_URL: 'http://localhost:3000',
  DATABASE_HOST: 'localhost',
  DATABASE_USER: 'vale',
  DATABASE_PASSWORD: 'vale',
  DATABASE_NAME: 'vale_project',
  JWT_ACCESS_SECRET: 'dev-access-secret-change-before-production',
  EMAIL_FROM: 'no-reply@local.vale.test',
} as const;

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_PORT: z.coerce.number().int().positive().default(3001),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    API_CORS_ORIGIN: z.string().url().default(LOCAL_DEFAULTS.API_CORS_ORIGIN),
    WEB_APP_URL: z.string().url().default(LOCAL_DEFAULTS.WEB_APP_URL),
    DATABASE_HOST: z.string().min(1).default(LOCAL_DEFAULTS.DATABASE_HOST),
    DATABASE_PORT: z.coerce.number().int().positive().default(5432),
    DATABASE_USER: z.string().min(1).default(LOCAL_DEFAULTS.DATABASE_USER),
    DATABASE_PASSWORD: z
      .string()
      .min(1)
      .default(LOCAL_DEFAULTS.DATABASE_PASSWORD),
    DATABASE_NAME: z.string().min(1).default(LOCAL_DEFAULTS.DATABASE_NAME),
    DATABASE_SSL_MODE: z.enum(['disable', 'verify-full']).default('disable'),
    DATABASE_SSL_CA: z.string().min(1).optional(),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32)
      .default(LOCAL_DEFAULTS.JWT_ACCESS_SECRET),
    JWT_ISSUER: z.string().min(1).default('vale-api'),
    JWT_AUDIENCE: z.string().min(1).default('vale-web'),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    REFRESH_COOKIE_PATH: z.string().startsWith('/').default('/auth'),
    SWAGGER_ENABLED: booleanString.optional(),
    EMAIL_VERIFICATION_TTL_HOURS: z.coerce
      .number()
      .int()
      .positive()
      .default(24),
    PASSWORD_RESET_TTL_MINUTES: z.coerce
      .number()
      .int()
      .min(5)
      .max(60)
      .default(15),
    LEGAL_TERMS_VERSION: z.string().min(1).default('terms-2026-07-24'),
    LEGAL_PRIVACY_VERSION: z.string().min(1).default('privacy-2026-07-24'),
    LEGAL_GUIDELINES_VERSION: z
      .string()
      .min(1)
      .default('guidelines-2026-07-24'),
    EMAIL_PROVIDER: z.enum(['log', 'http']).default('log'),
    EMAIL_FROM: z.string().email().default(LOCAL_DEFAULTS.EMAIL_FROM),
    EMAIL_HTTP_ENDPOINT: z.string().url().optional(),
    EMAIL_HTTP_TOKEN: z.string().min(16).optional(),
    OUTBOX_ENCRYPTION_KEY: z.string().min(1).optional(),
    OUTBOX_DISPATCH_ENABLED: booleanString.default(false),
    OUTBOX_POLL_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(5)
      .max(3600)
      .default(30),
    OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(8),
    IDEMPOTENCY_REQUIRED: booleanString.default(false),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    PROFILE_STORAGE_ROOT: z.string().min(1).default('.data/profile-uploads'),
    FILE_SCAN_DRIVER: z.enum(['disabled', 'clamav']).default('disabled'),
    CLAMAV_HOST: z.string().min(1).optional(),
    CLAMAV_PORT: z.coerce.number().int().positive().default(3310),
    CLAMAV_TIMEOUT_MILLISECONDS: z.coerce
      .number()
      .int()
      .min(500)
      .max(30_000)
      .default(5000),
    RATE_LIMIT_CLEANUP_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(30)
      .max(86_400)
      .default(300),
    JOB_ACTIVE_LIMIT: z.coerce.number().int().min(1).max(20).default(3),
    APPLICATION_RESUME_RETENTION_DAYS: z.coerce
      .number()
      .int()
      .min(30)
      .max(730)
      .default(180),
    RETENTION_JOB_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86_400)
      .default(86_400),
    RETENTION_JOB_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(500)
      .default(100),
    RETENTION_JOB_MAX_ITEMS_PER_CYCLE: z.coerce
      .number()
      .int()
      .min(1)
      .max(10_000)
      .default(1000),
    RETENTION_ALERT_AGE_SECONDS: z.coerce
      .number()
      .int()
      .min(3600)
      .max(604_800)
      .default(86_400),
    S3_ENDPOINT: z.string().url().optional(),
    S3_BUCKET: z.string().min(1).optional(),
    S3_REGION: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_TIMEOUT_MILLISECONDS: z.coerce
      .number()
      .int()
      .min(500)
      .max(30_000)
      .default(5000),
    S3_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
    S3_CIRCUIT_FAILURE_THRESHOLD: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5),
    S3_CIRCUIT_RESET_SECONDS: z.coerce
      .number()
      .int()
      .min(5)
      .max(300)
      .default(30),
    SEED_ADMIN_EMAIL: z.string().email().optional(),
    SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
  })
  .superRefine((env, context) => {
    if (env.EMAIL_PROVIDER === 'http') {
      if (!env.EMAIL_HTTP_ENDPOINT) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'EMAIL_HTTP_ENDPOINT is required for the HTTP provider.',
          path: ['EMAIL_HTTP_ENDPOINT'],
        });
      }

      if (!env.EMAIL_HTTP_TOKEN) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'EMAIL_HTTP_TOKEN is required for the HTTP provider.',
          path: ['EMAIL_HTTP_TOKEN'],
        });
      }
    }

    if (env.OUTBOX_ENCRYPTION_KEY) {
      try {
        if (Buffer.from(env.OUTBOX_ENCRYPTION_KEY, 'base64').length !== 32) {
          throw new Error('invalid key length');
        }
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'OUTBOX_ENCRYPTION_KEY must be a base64-encoded 32-byte key.',
          path: ['OUTBOX_ENCRYPTION_KEY'],
        });
      }
    }

    if (env.STORAGE_DRIVER === 's3') {
      for (const key of [
        'S3_ENDPOINT',
        'S3_BUCKET',
        'S3_REGION',
        'S3_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY',
      ] as const) {
        if (!env[key]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${key} is required for S3-compatible storage.`,
            path: [key],
          });
        }
      }
    }

    if (env.FILE_SCAN_DRIVER === 'clamav' && !env.CLAMAV_HOST) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CLAMAV_HOST is required when FILE_SCAN_DRIVER=clamav.',
        path: ['CLAMAV_HOST'],
      });
    }

    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (env.DATABASE_SSL_MODE !== 'verify-full') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'DATABASE_SSL_MODE must be verify-full in production; unverified remote database TLS is not allowed.',
        path: ['DATABASE_SSL_MODE'],
      });
    }

    if (!env.DATABASE_SSL_CA) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'DATABASE_SSL_CA is required in production to verify the database certificate.',
        path: ['DATABASE_SSL_CA'],
      });
    }

    if (!env.OUTBOX_ENCRYPTION_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'OUTBOX_ENCRYPTION_KEY is required in production to protect transient notification data.',
        path: ['OUTBOX_ENCRYPTION_KEY'],
      });
    }

    for (const key of ['API_CORS_ORIGIN', 'WEB_APP_URL'] as const) {
      if (!env[key].startsWith('https://')) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must use HTTPS in production.`,
          path: [key],
        });
      }
    }

    if (env.API_CORS_ORIGIN !== env.WEB_APP_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'API_CORS_ORIGIN and WEB_APP_URL must be the same public origin in production.',
        path: ['API_CORS_ORIGIN'],
      });
    }

    if (env.REFRESH_COOKIE_PATH !== '/api/auth') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'REFRESH_COOKIE_PATH must be /api/auth for the production reverse-proxy topology.',
        path: ['REFRESH_COOKIE_PATH'],
      });
    }

    if (env.SWAGGER_ENABLED === true) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Swagger must be disabled in production.',
        path: ['SWAGGER_ENABLED'],
      });
    }

    const forbiddenProductionDefaults: Array<keyof typeof LOCAL_DEFAULTS> = [
      'API_CORS_ORIGIN',
      'WEB_APP_URL',
      'DATABASE_HOST',
      'DATABASE_USER',
      'DATABASE_PASSWORD',
      'DATABASE_NAME',
      'JWT_ACCESS_SECRET',
      'EMAIL_FROM',
    ];

    for (const key of forbiddenProductionDefaults) {
      if (env[key] === LOCAL_DEFAULTS[key]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must not use the local default in production.`,
          path: [key],
        });
      }
    }

    if (env.EMAIL_PROVIDER !== 'http') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A remote email provider is required in production.',
        path: ['EMAIL_PROVIDER'],
      });
    }

    if (env.EMAIL_HTTP_ENDPOINT && !env.EMAIL_HTTP_ENDPOINT.startsWith('https://')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'EMAIL_HTTP_ENDPOINT must use HTTPS in production.',
        path: ['EMAIL_HTTP_ENDPOINT'],
      });
    }

    if (env.STORAGE_DRIVER !== 's3') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'S3-compatible storage is required in production.',
        path: ['STORAGE_DRIVER'],
      });
    }

    if (env.S3_ENDPOINT && !env.S3_ENDPOINT.startsWith('https://')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'S3_ENDPOINT must use HTTPS in production.',
        path: ['S3_ENDPOINT'],
      });
    }

    if (env.FILE_SCAN_DRIVER !== 'clamav') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ClamAV file inspection is required in production.',
        path: ['FILE_SCAN_DRIVER'],
      });
    }
  })
  .transform((env) => ({
    ...env,
    SWAGGER_ENABLED: env.SWAGGER_ENABLED ?? env.NODE_ENV === 'development',
  }));

export type Env = z.infer<typeof envSchema>;
