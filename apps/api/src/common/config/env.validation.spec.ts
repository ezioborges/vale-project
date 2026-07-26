import { LOCAL_DEFAULTS, envSchema } from './env.validation';

describe('production environment validation', () => {
  it.each(Object.keys(LOCAL_DEFAULTS))(
    'rejects local default %s in production',
    (key) => {
      const production = validProductionEnvironment();
      const result = envSchema.safeParse({
        ...production,
        [key]: LOCAL_DEFAULTS[key as keyof typeof LOCAL_DEFAULTS],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path[0] === key)).toBe(
        true,
      );
    },
  );

  it('requires a remote email provider in production', () => {
    const result = envSchema.safeParse({
      ...validProductionEnvironment(),
      EMAIL_PROVIDER: 'log',
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path[0] === 'EMAIL_PROVIDER'),
    ).toBe(true);
  });

  it('requires remote object storage in production', () => {
    const local = envSchema.safeParse({
      ...validProductionEnvironment(),
      STORAGE_DRIVER: 'local',
    });
    expect(local.success).toBe(false);
    expect(
      local.error?.issues.some((issue) => issue.path[0] === 'STORAGE_DRIVER'),
    ).toBe(true);

    const incomplete = envSchema.safeParse({
      ...validProductionEnvironment(),
      S3_SECRET_ACCESS_KEY: undefined,
    });
    expect(incomplete.success).toBe(false);
    expect(
      incomplete.error?.issues.some(
        (issue) => issue.path[0] === 'S3_SECRET_ACCESS_KEY',
      ),
    ).toBe(true);
  });

  it('accepts non-local production credentials with remote providers', () => {
    expect(envSchema.safeParse(validProductionEnvironment()).success).toBe(
      true,
    );
  });

  it('requires the documented same-origin proxy topology in production', () => {
    const differentOrigin = envSchema.safeParse({
      ...validProductionEnvironment(),
      API_CORS_ORIGIN: 'https://api.vale.example',
    });
    const exposedSwagger = envSchema.safeParse({
      ...validProductionEnvironment(),
      SWAGGER_ENABLED: 'true',
    });

    expect(differentOrigin.success).toBe(false);
    expect(exposedSwagger.success).toBe(false);
  });

  it('enables Swagger only by default in development', () => {
    expect(envSchema.parse({ NODE_ENV: 'development' }).SWAGGER_ENABLED).toBe(
      true,
    );
    expect(envSchema.parse({ NODE_ENV: 'test' }).SWAGGER_ENABLED).toBe(false);
  });
});

function validProductionEnvironment() {
  return {
    NODE_ENV: 'production',
    API_CORS_ORIGIN: 'https://app.vale.example',
    WEB_APP_URL: 'https://app.vale.example',
    DATABASE_HOST: 'db.internal.vale.example',
    DATABASE_USER: 'vale_runtime',
    DATABASE_PASSWORD: 'production-secret',
    DATABASE_NAME: 'vale_production',
    JWT_ACCESS_SECRET: 'production-secret-with-more-than-32-characters',
    REFRESH_COOKIE_PATH: '/api/auth',
    EMAIL_PROVIDER: 'http',
    EMAIL_FROM: 'contato@vale.example',
    EMAIL_HTTP_ENDPOINT: 'https://email.vale.example/send',
    EMAIL_HTTP_TOKEN: 'remote-provider-token',
    STORAGE_DRIVER: 's3',
    S3_ENDPOINT: 'https://storage.vale.example',
    S3_BUCKET: 'profile-files',
    S3_REGION: 'auto',
    S3_ACCESS_KEY_ID: 'storage-access-key',
    S3_SECRET_ACCESS_KEY: 'storage-secret-key',
  };
}
