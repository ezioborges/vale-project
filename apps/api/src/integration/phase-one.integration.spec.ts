import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import request, { Response } from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { AuditEvent } from '../audit/audit-event.entity';
import { EMAIL_SENDER, EmailMessage, EmailSender } from '../email/email-sender';
import { RateLimitCounter } from '../common/rate-limit/rate-limit-counter.entity';
import { TermAcceptance } from '../terms/term-acceptance.entity';
import { User } from '../users/user.entity';
import { InitializeDatabase1710000000000 } from '../database/migrations/1710000000000-InitializeDatabase';
import { CreateIdentityTables1710000001000 } from '../database/migrations/1710000001000-CreateIdentityTables';
import { CompletePhaseOne1710000002000 } from '../database/migrations/1710000002000-CompletePhaseOne';

const integrationDescribe =
  process.env.RUN_INTEGRATION_TESTS === 'true' ? describe : describe.skip;
type TestAgent = ReturnType<typeof request.agent>;

class RecordingEmailSender implements EmailSender {
  messages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }

  tokenFor(email: string, subject: string): string {
    const message = [...this.messages]
      .reverse()
      .find(
        (candidate) =>
          candidate.to === email && candidate.subject.includes(subject),
      );
    const url = message?.text.match(/https?:\/\/\S+/)?.[0];
    const token = url ? new URL(url).searchParams.get('token') : null;

    if (!token) {
      throw new Error(`No ${subject} token recorded for ${email}.`);
    }

    return token;
  }
}

integrationDescribe('Phase 1 with controllers and PostgreSQL', () => {
  jest.setTimeout(60_000);

  const emailSender = new RecordingEmailSender();
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let users: Repository<User>;
  let acceptances: Repository<TermAcceptance>;
  let auditEvents: Repository<AuditEvent>;

  beforeAll(async () => {
    await resetTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_SENDER)
      .useValue(emailSender)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    users = dataSource.getRepository(User);
    acceptances = dataSource.getRepository(TermAcceptance);
    auditEvents = dataSource.getRepository(AuditEvent);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('runs register → verification → login → refresh → logout via cookies', async () => {
    const agent = request.agent(app.getHttpServer());
    const email = 'flow@example.com';
    const registration = await register(agent, email, 'candidate');

    expect(registration.status).toBe(201);
    expect(registration.body).toMatchObject({
      expiresInSeconds: 900,
      user: {
        displayName: 'Fluxo Principal',
        email,
        role: 'candidate',
        status: 'pending_email',
        initialPath: '/onboarding/candidato',
      },
    });
    expect(registration.body).not.toHaveProperty('accessToken');
    expect(registration.body).not.toHaveProperty('refreshToken');
    expect(registration.body).not.toHaveProperty('devEmailVerificationToken');
    expect(
      await acceptances.countBy({ userId: registration.body.user.id }),
    ).toBe(3);

    const verificationToken = emailSender.tokenFor(email, 'Confirme');
    const verification = await agent
      .post('/auth/verify-email')
      .send({ token: verificationToken });

    expect(verification.status).toBe(200);
    expect(verification.body.status).toBe('active');
    expect(verification.body.initialPath).toBe('/app/candidato');

    const login = await agent
      .post('/auth/login')
      .send({ email, password: 'initial-password' });
    expect(login.status).toBe(200);
    expect(login.body).not.toHaveProperty('accessToken');

    const refreshed = await agent.post('/auth/refresh').send({});
    expect(refreshed.status).toBe(200);

    expect((await agent.post('/auth/logout').send({})).status).toBe(204);
    expect((await agent.post('/auth/refresh').send({})).status).toBe(401);
  });

  it('uses one-time password reset tokens and revokes existing sessions', async () => {
    const email = 'flow@example.com';
    const agent = request.agent(app.getHttpServer());
    expect(
      (
        await agent.post('/auth/login').send({
          email,
          password: 'initial-password',
        })
      ).status,
    ).toBe(200);

    const forgot = await agent.post('/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(202);
    expect(forgot.body.message).toContain('If an account exists');

    const token = emailSender.tokenFor(email, 'Redefina');
    const reset = await agent.post('/auth/reset-password').send({
      token,
      password: 'new-secure-password',
    });
    expect(reset.status).toBe(200);
    expect((await agent.get('/users/me')).status).toBe(401);
    expect(
      (
        await agent.post('/auth/reset-password').send({
          token,
          password: 'another-secure-password',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent.post('/auth/login').send({
          email,
          password: 'initial-password',
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await agent.post('/auth/login').send({
          email,
          password: 'new-secure-password',
        })
      ).status,
    ).toBe(200);
  });

  it('covers negative and positive RBAC and writes administrative audit evidence', async () => {
    const adminEmail = 'admin-flow@example.com';
    const targetEmail = 'target@example.com';
    const adminAgent = request.agent(app.getHttpServer());
    const targetAgent = request.agent(app.getHttpServer());
    const admin = await registerAndVerify(
      adminAgent,
      adminEmail,
      'candidate',
      'Admin do Piloto',
    );
    const target = await registerAndVerify(
      targetAgent,
      targetEmail,
      'candidate',
      'Pessoa Alvo',
    );

    expect(
      (
        await targetAgent.patch(`/users/${target.id}/role`).send({
          role: 'coordinator',
          reason: 'Tentativa sem permissão administrativa.',
        })
      ).status,
    ).toBe(403);

    await users.update(admin.id, { role: 'admin' });
    expect(
      (
        await adminAgent.post('/auth/login').send({
          email: adminEmail,
          password: 'initial-password',
        })
      ).status,
    ).toBe(200);

    const promotion = await adminAgent.patch(`/users/${target.id}/role`).send({
      role: 'coordinator',
      reason: 'Promoção aprovada para operação do piloto.',
    });
    expect(promotion.status).toBe(200);
    expect(promotion.body.role).toBe('coordinator');

    const suspension = await adminAgent
      .patch(`/users/${target.id}/status`)
      .send({
        status: 'suspended',
        reason: 'Suspensão administrativa para validação do piloto.',
      });
    expect(suspension.status).toBe(200);
    expect(suspension.body.status).toBe('suspended');

    const deactivation = await adminAgent
      .patch(`/users/${target.id}/status`)
      .send({
        status: 'disabled',
        reason: 'Desativação administrativa registrada durante o piloto.',
      });
    expect(deactivation.status).toBe(200);
    expect(deactivation.body.status).toBe('disabled');

    expect(
      await auditEvents.countBy({
        actorUserId: admin.id,
        targetUserId: target.id,
      }),
    ).toBe(3);
    expect((await targetAgent.get('/users/me')).status).toBe(403);
  });

  it.each(['suspended', 'disabled'] as const)(
    'does not let email verification reactivate a %s pending account',
    async (status) => {
      const admin = await users.findOneByOrFail({
        email: 'admin-flow@example.com',
      });
      const adminAgent = request.agent(app.getHttpServer());
      await adminAgent.post('/auth/login').send({
        email: admin.email,
        password: 'initial-password',
      });

      const pendingAgent = request.agent(app.getHttpServer());
      const email = `pending-${status}@example.com`;
      const registration = await register(
        pendingAgent,
        email,
        'employer',
        'Contratante Pendente',
      );
      const userId = registration.body.user.id as string;

      const statusChange = await adminAgent
        .patch(`/users/${userId}/status`)
        .send({
          status,
          reason: 'Bloqueio preventivo antes da confirmação do e-mail.',
        });
      expect(statusChange.status).toBe(200);

      const token = emailSender.tokenFor(email, 'Confirme');
      const verification = await pendingAgent
        .post('/auth/verify-email')
        .send({ token });
      expect(verification.status).toBe(200);
      expect(verification.body.emailVerifiedAt).not.toBeNull();
      expect(verification.body.status).toBe(status);
      expect(verification.body.initialPath).toBe('/conta-indisponivel');
    },
  );

  it('serializes concurrent refreshes and revokes the family on reuse', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin-flow@example.com',
      password: 'initial-password',
    });
    const refreshToken = cookieValue(login, 'vale_refresh_token');

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken }),
      request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken }),
    ]);
    const responses = [first, second].sort((a, b) => a.status - b.status);

    expect(responses.map((response) => response.status)).toEqual([200, 401]);
    const successor = cookieValue(responses[0]!, 'vale_refresh_token');
    const familyRevoked = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: successor });
    expect(familyRevoked.status).toBe(401);
    expect(familyRevoked.body.message).toContain('reuse detected');
  });

  it('rate limits repeated login attempts with a retry hint', async () => {
    await dataSource.getRepository(RateLimitCounter).clear();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'absent@example.com',
          password: 'incorrect-password',
        });
      expect(response.status).toBe(401);
    }

    const limited = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'absent@example.com',
        password: 'incorrect-password',
      });
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();
  });

  async function registerAndVerify(
    agent: TestAgent,
    email: string,
    role: 'candidate' | 'employer',
    displayName: string,
  ) {
    const registration = await register(agent, email, role, displayName);
    const token = emailSender.tokenFor(email, 'Confirme');
    const verification = await agent.post('/auth/verify-email').send({ token });

    expect(verification.status).toBe(200);
    return registration.body.user as { id: string };
  }
});

function register(
  agent: TestAgent,
  email: string,
  role: 'candidate' | 'employer',
  displayName = 'Fluxo Principal',
): Promise<Response> {
  return agent.post('/auth/register').send({
    displayName,
    email,
    password: 'initial-password',
    role,
    acceptedTermsVersion: 'terms-2026-07-24',
    acceptedPrivacyVersion: 'privacy-2026-07-24',
    acceptedGuidelinesVersion: 'guidelines-2026-07-24',
    acceptTerms: true,
    acceptPrivacy: true,
    acceptGuidelines: true,
  });
}

function cookieValue(response: Response, name: string): string {
  const setCookie = response.headers['set-cookie'] as unknown as
    | string[]
    | undefined;
  const cookie = setCookie?.find((candidate) =>
    candidate.startsWith(`${name}=`),
  );
  const value = cookie?.split(';')[0]?.slice(name.length + 1);

  if (!value) {
    throw new Error(`Cookie ${name} was not set.`);
  }

  return value;
}

async function resetTestDatabase(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    migrations: [
      InitializeDatabase1710000000000,
      CreateIdentityTables1710000001000,
      CompletePhaseOne1710000002000,
    ],
  });

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
