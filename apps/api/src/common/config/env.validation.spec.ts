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

  it('accepts non-local production credentials with the HTTP provider', () => {
    expect(envSchema.safeParse(validProductionEnvironment()).success).toBe(
      true,
    );
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
    EMAIL_PROVIDER: 'http',
    EMAIL_FROM: 'contato@vale.example',
    EMAIL_HTTP_ENDPOINT: 'https://email.vale.example/send',
    EMAIL_HTTP_TOKEN: 'remote-provider-token',
  };
}
