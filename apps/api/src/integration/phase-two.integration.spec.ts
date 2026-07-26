import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import request, { Response } from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { AuditEvent } from '../audit/audit-event.entity';
import { CreateIdentityTables1710000001000 } from '../database/migrations/1710000001000-CreateIdentityTables';
import { CompletePhaseOne1710000002000 } from '../database/migrations/1710000002000-CompletePhaseOne';
import { CreateProfilesAndPrivacy1710000003000 } from '../database/migrations/1710000003000-CreateProfilesAndPrivacy';
import { InitializeDatabase1710000000000 } from '../database/migrations/1710000000000-InitializeDatabase';
import { EMAIL_SENDER, EmailMessage, EmailSender } from '../email/email-sender';
import { EmployerProfile } from '../profiles/employer-profile.entity';

const integrationDescribe =
  process.env.RUN_INTEGRATION_TESTS === 'true' ? describe : describe.skip;
type TestAgent = ReturnType<typeof request.agent>;

class RecordingEmailSender implements EmailSender {
  messages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }

  tokenFor(email: string): string {
    const message = [...this.messages]
      .reverse()
      .find(
        (candidate) =>
          candidate.to === email && candidate.subject.includes('Confirme'),
      );
    const url = message?.text.match(/https?:\/\/\S+/)?.[0];
    const token = url ? new URL(url).searchParams.get('token') : null;
    if (!token) throw new Error(`No verification token recorded for ${email}.`);
    return token;
  }
}

integrationDescribe('Phase 2 profiles and privacy with PostgreSQL', () => {
  jest.setTimeout(60_000);

  const emailSender = new RecordingEmailSender();
  let app: NestExpressApplication;
  let employers: Repository<EmployerProfile>;
  let auditEvents: Repository<AuditEvent>;
  let candidateAgent: TestAgent;
  let employerAgent: TestAgent;
  let candidateProfileId: string;
  let uploadedResumeId: string;

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

    const dataSource = app.get(DataSource);
    employers = dataSource.getRepository(EmployerProfile);
    auditEvents = dataSource.getRepository(AuditEvent);
    candidateAgent = request.agent(app.getHttpServer());
    employerAgent = request.agent(app.getHttpServer());
    await registerAndVerify(
      candidateAgent,
      'phase-two-candidate@example.com',
      'candidate',
      'Nome de Exibição',
    );
    await registerAndVerify(
      employerAgent,
      'phase-two-employer@example.com',
      'employer',
      'Pessoa Recrutadora',
    );
  });

  afterAll(async () => {
    if (uploadedResumeId) {
      await candidateAgent.delete(`/profiles/files/${uploadedResumeId}`);
    }
    await app?.close();
  });

  it('creates structured profiles with a private candidate default', async () => {
    expect((await candidateAgent.get('/profiles/me')).status).toBe(404);

    const candidate = await candidateAgent
      .patch('/profiles/candidate/me')
      .send({
        displayName: 'Nome Social Profissional',
        pronouns: 'ela/dela',
        headline: 'Desenvolvedora backend',
        bio: 'Experiência com plataformas seguras e inclusivas.',
        location: 'São Paulo, SP',
        workPreferences: {
          areas: ['Tecnologia'],
          workModes: ['remote', 'hybrid'],
          contractTypes: ['clt'],
          availability: 'Imediata',
        },
        skills: ['NestJS', 'PostgreSQL'],
        experiences: [
          {
            title: 'Desenvolvedora',
            organization: 'Cooperativa',
            startDate: '2024-01',
            endDate: null,
            current: true,
            description: 'APIs e proteção de dados.',
          },
        ],
        education: [],
        professionalLinks: ['https://example.com/portfolio'],
      });

    expect(candidate.status).toBe(200);
    expect(candidate.body).toMatchObject({
      kind: 'candidate',
      displayName: 'Nome Social Profissional',
      visibility: 'private',
      isActive: true,
      workPreferences: {
        workModes: ['remote', 'hybrid'],
      },
    });
    expect(candidate.body.completionPercentage).toBeGreaterThan(50);
    candidateProfileId = candidate.body.id as string;

    const invalidOrganization = await employerAgent
      .patch('/profiles/employer/me')
      .send({ type: 'company', organizationName: null });
    expect(invalidOrganization.status).toBe(400);

    const employer = await employerAgent.patch('/profiles/employer/me').send({
      type: 'company',
      responsibleName: 'Pessoa Recrutadora',
      contactEmail: 'talentos@example.com',
      organizationName: 'Empresa Aliada',
      segment: 'Tecnologia',
      description: 'Organização comprometida com ambientes inclusivos.',
      website: 'https://example.com',
      location: 'Remoto',
    });
    expect(employer.status).toBe(200);
    expect(employer.body).toMatchObject({
      kind: 'employer',
      isVerified: false,
      organizationName: 'Empresa Aliada',
    });
  });

  it('enforces role boundaries on profile updates and upload kinds', async () => {
    expect(
      (
        await employerAgent
          .patch('/profiles/candidate/me')
          .send({ headline: 'Tentativa indevida' })
      ).status,
    ).toBe(403);
    expect(
      (
        await candidateAgent
          .patch('/profiles/employer/me')
          .send({ description: 'Tentativa indevida' })
      ).status,
    ).toBe(403);
    expect(
      (
        await employerAgent
          .post('/profiles/files')
          .field('kind', 'resume')
          .attach('file', Buffer.from('%PDF-1.4\n%%EOF'), 'resume.pdf')
      ).status,
    ).toBe(403);
  });

  it('validates file content and serves valid files only through authorization', async () => {
    const disguised = await candidateAgent
      .post('/profiles/files')
      .field('kind', 'resume')
      .attach('file', Buffer.from('not a pdf'), {
        contentType: 'application/pdf',
        filename: 'resume.pdf',
      });
    expect(disguised.status).toBe(415);

    const uploaded = await candidateAgent
      .post('/profiles/files')
      .field('kind', 'resume')
      .attach('file', Buffer.from('%PDF-1.4\n1 0 obj\n%%EOF'), {
        contentType: 'application/pdf',
        filename: 'currículo profissional.pdf',
      });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body).toMatchObject({
      kind: 'resume',
      mimeType: 'application/pdf',
    });
    uploadedResumeId = uploaded.body.id as string;

    const ownerDownload = await candidateAgent.get(
      `/profiles/files/${uploadedResumeId}`,
    );
    expect(ownerDownload.status).toBe(200);
    expect(ownerDownload.headers['cache-control']).toBe('private, no-store');
    expect(ownerDownload.headers['x-content-type-options']).toBe('nosniff');
    expect(ownerDownload.body.subarray(0, 5).toString()).toBe('%PDF-');

    expect(
      (await employerAgent.get(`/profiles/files/${uploadedResumeId}`)).status,
    ).toBe(403);
  });

  it('grants broad visibility only to verified employers', async () => {
    const visibility = await candidateAgent
      .patch('/profiles/candidate/me/visibility')
      .send({ visibility: 'verified_employers' });
    expect(visibility.status).toBe(200);

    expect(
      (await employerAgent.get(`/profiles/candidates/${candidateProfileId}`))
        .status,
    ).toBe(403);

    const employer = await employers.findOneByOrFail({
      contactEmail: 'talentos@example.com',
    });
    await employers.update(employer.id, { isVerified: true });

    const allowed = await employerAgent.get(
      `/profiles/candidates/${candidateProfileId}`,
    );
    expect(allowed.status).toBe(200);
    expect(allowed.body.skills).toEqual(['NestJS', 'PostgreSQL']);
    expect(
      (await employerAgent.get(`/profiles/files/${uploadedResumeId}`)).status,
    ).toBe(200);

    await candidateAgent
      .patch('/profiles/candidate/me/visibility')
      .send({ visibility: 'applications_only' });
    const applicationOnly = await employerAgent.get(
      `/profiles/candidates/${candidateProfileId}`,
    );
    expect(applicationOnly.status).toBe(403);
    expect(applicationOnly.body.message).toContain('application');

    await candidateAgent
      .patch('/profiles/candidate/me/visibility')
      .send({ visibility: 'private' });
    expect(
      (await employerAgent.get(`/profiles/candidates/${candidateProfileId}`))
        .status,
    ).toBe(403);
    expect(
      (await candidateAgent.get(`/profiles/candidates/${candidateProfileId}`))
        .status,
    ).toBe(200);
  });

  it('audits sensitive changes without copying profile values', async () => {
    const events = await auditEvents.find({
      where: { action: 'candidate_profile.created' },
      order: { createdAt: 'DESC' },
    });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]?.context).toMatchObject({
      changedFields: expect.arrayContaining(['bio', 'skills']),
    });
    expect(JSON.stringify(events[0]?.context)).not.toContain(
      'Experiência com plataformas',
    );

    const visibilityEvents = await auditEvents.countBy({
      action: 'candidate_profile.visibility_changed',
    });
    expect(visibilityEvents).toBe(3);
  });

  it('resets verification when the verified institutional identity changes', async () => {
    const changed = await employerAgent.patch('/profiles/employer/me').send({
      organizationName: 'Nova Identidade Institucional',
    });
    expect(changed.status).toBe(200);
    expect(changed.body.isVerified).toBe(false);
    expect(
      await auditEvents.countBy({
        action: 'employer_profile.verification_reset',
      }),
    ).toBe(1);
  });

  async function registerAndVerify(
    agent: TestAgent,
    email: string,
    role: 'candidate' | 'employer',
    displayName: string,
  ): Promise<Response> {
    const registration = await agent.post('/auth/register').send({
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
    expect(registration.status).toBe(201);

    const verification = await agent
      .post('/auth/verify-email')
      .send({ token: emailSender.tokenFor(email) });
    expect(verification.status).toBe(200);
    return registration;
  }
});

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
      CreateProfilesAndPrivacy1710000003000,
    ],
  });

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
