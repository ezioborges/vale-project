import { randomUUID } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { Env } from '../common/config/env.validation';
import { configureHttpApp } from '../common/http/http.config';
import { AuditEvent } from '../audit/audit-event.entity';
import { CreateIdentityTables1710000001000 } from '../database/migrations/1710000001000-CreateIdentityTables';
import { CompletePhaseOne1710000002000 } from '../database/migrations/1710000002000-CompletePhaseOne';
import { CreateProfilesAndPrivacy1710000003000 } from '../database/migrations/1710000003000-CreateProfilesAndPrivacy';
import { CreateJobsAndApplications1710000004000 } from '../database/migrations/1710000004000-CreateJobsAndApplications';
import { HardenAbuseUploadsRetention1710000006000 } from '../database/migrations/1710000006000-HardenAbuseUploadsRetention';
import { CreateOutbox1710000007000 } from '../database/migrations/1710000007000-CreateOutbox';
import { CreateIdempotencyRecords1710000008000 } from '../database/migrations/1710000008000-CreateIdempotencyRecords';
import { InitializeDatabase1710000000000 } from '../database/migrations/1710000000000-InitializeDatabase';
import { EMAIL_SENDER, EmailMessage, EmailSender } from '../email/email-sender';
import { ApplicationResumeSnapshot } from '../jobs/application-resume-snapshot.entity';
import { ApplicationRetentionService } from '../jobs/application-retention.service';
import { enableCsrfForAgent } from './csrf-test.helper';
import { Application } from '../jobs/application.entity';
import { Job } from '../jobs/job.entity';
import { FILE_STORAGE, FileStorage } from '../profiles/file-storage';
import { User } from '../users/user.entity';

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

integrationDescribe('Phase 3 jobs, moderation and applications', () => {
  jest.setTimeout(90_000);

  const emailSender = new RecordingEmailSender();
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let users: Repository<User>;
  let jobs: Repository<Job>;
  let applications: Repository<Application>;
  let snapshots: Repository<ApplicationResumeSnapshot>;
  let retention: ApplicationRetentionService;
  let audits: Repository<AuditEvent>;
  let storage: FileStorage;
  let candidateAgent: TestAgent;
  let employerAgent: TestAgent;
  let otherEmployerAgent: TestAgent;
  let coordinatorAgent: TestAgent;
  let candidateProfileId: string;
  let currentResumeId: string;
  let jobId: string;
  let applicationId: string;

  beforeAll(async () => {
    await resetTestDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_SENDER)
      .useValue(emailSender)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureHttpApp(app, moduleRef.get(ConfigService<Env, true>));
    await app.init();

    dataSource = app.get(DataSource);
    users = dataSource.getRepository(User);
    jobs = dataSource.getRepository(Job);
    applications = dataSource.getRepository(Application);
    snapshots = dataSource.getRepository(ApplicationResumeSnapshot);
    retention = app.get(ApplicationRetentionService);
    audits = dataSource.getRepository(AuditEvent);
    storage = app.get<FileStorage>(FILE_STORAGE);

    candidateAgent = request.agent(app.getHttpServer());
    employerAgent = request.agent(app.getHttpServer());
    otherEmployerAgent = request.agent(app.getHttpServer());
    coordinatorAgent = request.agent(app.getHttpServer());

    await registerAndVerify(
      candidateAgent,
      'phase-three-candidate@example.com',
      'candidate',
      'Pessoa Candidata',
    );
    await registerAndVerify(
      employerAgent,
      'phase-three-employer@example.com',
      'employer',
      'Pessoa Contratante',
    );
    await registerAndVerify(
      otherEmployerAgent,
      'phase-three-other@example.com',
      'employer',
      'Outro Contratante',
    );
    await registerAndVerify(
      coordinatorAgent,
      'phase-three-coordinator@example.com',
      'employer',
      'Pessoa Coordenadora',
    );
    await users.update(
      { email: 'phase-three-coordinator@example.com' },
      { role: 'coordinator' },
    );

    const candidate = await candidateAgent
      .patch('/profiles/candidate/me')
      .send({
        displayName: 'Pessoa Candidata',
        headline: 'Desenvolvedora Backend',
        bio: 'Experiência na construção de produtos seguros e inclusivos.',
        location: 'São Paulo, SP',
        workPreferences: {
          areas: ['Tecnologia'],
          workModes: ['remote', 'hybrid'],
          contractTypes: ['clt'],
          availability: 'Imediata',
        },
        skills: ['TypeScript', 'PostgreSQL'],
        experiences: [],
        education: [],
        professionalLinks: [],
      });
    expect(candidate.status).toBe(200);
    candidateProfileId = candidate.body.id as string;

    const resume = await candidateAgent
      .post('/profiles/files')
      .field('kind', 'resume')
      .attach('file', Buffer.from('%PDF-1.4\nphase-three\n%%EOF'), {
        contentType: 'application/pdf',
        filename: 'curriculo-fase-3.pdf',
      });
    expect(resume.status).toBe(201);
    currentResumeId = resume.body.id as string;

    const employer = await employerAgent.patch('/profiles/employer/me').send({
      type: 'company',
      responsibleName: 'Pessoa Contratante',
      contactEmail: 'talentos@empresa-aliada.example',
      organizationName: 'Empresa Aliada',
      segment: 'Tecnologia',
      description: 'Produto digital com práticas inclusivas.',
      website: 'https://empresa-aliada.example',
      location: 'São Paulo, SP',
    });
    expect(employer.status).toBe(200);

    await otherEmployerAgent.patch('/profiles/employer/me').send({
      type: 'company',
      responsibleName: 'Outro Contratante',
      contactEmail: 'talentos@outra.example',
      organizationName: 'Outra Empresa',
      segment: 'Serviços',
      description: 'Outro perfil institucional.',
      website: 'https://outra.example',
      location: 'Remoto',
    });
  });

  afterAll(async () => {
    if (currentResumeId) {
      await candidateAgent.delete(`/profiles/files/${currentResumeId}`);
    }
    await app?.close();
  });

  it('creates a moderated job and protects the public search', async () => {
    const invalidSalary = await employerAgent.post('/jobs').send({
      ...validJob(),
      salaryMin: 9000,
      salaryMax: 7000,
    });
    expect(invalidSalary.status).toBe(400);

    const created = await employerAgent.post('/jobs').send(validJob());
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending_review');
    jobId = created.body.id as string;

    const hiddenBeforeReview = await request(app.getHttpServer()).get('/jobs');
    expect(hiddenBeforeReview.status).toBe(200);
    expect(hiddenBeforeReview.body.total).toBe(0);

    const forbiddenModeration = await employerAgent
      .post(`/moderation/jobs/${jobId}/decision`)
      .send({ decision: 'approve' });
    expect(forbiddenModeration.status).toBe(403);

    const approved = await coordinatorAgent
      .post(`/moderation/jobs/${jobId}/decision`)
      .send({ decision: 'approve' });
    expect(approved.status).toBe(201);
    expect(approved.body.status).toBe('approved');

    const publicSearch = await request(app.getHttpServer()).get('/jobs').query({
      q: 'backend',
      area: 'Tecnológia',
      workMode: 'hybrid',
      contractType: 'clt',
      seniority: 'mid',
    });
    expect(publicSearch.status).toBe(200);
    expect(publicSearch.body.total).toBe(1);
    expect(publicSearch.body.items[0]).toMatchObject({
      id: jobId,
      title: 'Pessoa Desenvolvedora Backend',
      status: 'approved',
      employer: { displayName: 'Empresa Aliada' },
    });
    expect(publicSearch.body.items[0]).not.toHaveProperty('moderationReason');
  });

  it('submits one atomic application and grants only relational access', async () => {
    const blockedPrivate = await candidateAgent
      .post(`/jobs/${jobId}/applications`)
      .send({ coverMessage: 'Tenho interesse nesta oportunidade.' });
    expect(blockedPrivate.status).toBe(403);

    await candidateAgent
      .patch('/profiles/candidate/me/visibility')
      .send({ visibility: 'applications_only' });

    const attempts = await Promise.all([
      candidateAgent
        .post(`/jobs/${jobId}/applications`)
        .send({ coverMessage: 'Tenho interesse nesta oportunidade.' }),
      candidateAgent
        .post(`/jobs/${jobId}/applications`)
        .send({ coverMessage: 'Requisição concorrente.' }),
    ]);
    expect(attempts.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    const submitted = attempts.find((response) => response.status === 201)!;
    applicationId = submitted.body.id as string;
    expect(submitted.body).toMatchObject({
      status: 'submitted',
      resumeFileName: 'curriculo-fase-3.pdf',
    });
    expect(submitted.body.history).toHaveLength(1);
    expect(await applications.count()).toBe(1);

    const received = await employerAgent.get(
      `/jobs/mine/${jobId}/applications`,
    );
    expect(received.status).toBe(200);
    expect(received.body.items[0]).toMatchObject({
      id: applicationId,
      candidate: {
        id: candidateProfileId,
        displayName: 'Pessoa Candidata',
      },
    });

    expect(
      (await otherEmployerAgent.get(`/jobs/mine/${jobId}/applications`)).status,
    ).toBe(404);
    expect(
      (await employerAgent.get(`/profiles/candidates/${candidateProfileId}`))
        .status,
    ).toBe(200);
    expect(
      (
        await otherEmployerAgent.get(
          `/profiles/candidates/${candidateProfileId}`,
        )
      ).status,
    ).toBe(403);

    expect(
      (await employerAgent.get(`/profiles/files/${currentResumeId}`)).status,
    ).toBe(403);
    const snapshot = await employerAgent.get(
      `/applications/${applicationId}/resume`,
    );
    expect(snapshot.status).toBe(200);
    expect(snapshot.headers['cache-control']).toBe('private, no-store');
    expect(snapshot.headers['x-content-type-options']).toBe('nosniff');
  });

  it('tracks valid status changes and revokes access after cancellation', async () => {
    const underReview = await employerAgent
      .patch(`/applications/${applicationId}/status`)
      .send({ status: 'under_review' });
    expect(underReview.status).toBe(200);
    expect(underReview.body.history).toHaveLength(2);

    const invalid = await employerAgent
      .patch(`/applications/${applicationId}/status`)
      .send({ status: 'under_review' });
    expect(invalid.status).toBe(409);

    const shortlisted = await employerAgent
      .patch(`/applications/${applicationId}/status`)
      .send({ status: 'shortlisted' });
    expect(shortlisted.status).toBe(200);

    const mine = await candidateAgent.get('/applications/mine');
    expect(mine.status).toBe(200);
    expect(mine.body.items[0].history).toHaveLength(3);

    const cancelled = await candidateAgent.post(
      `/applications/mine/${applicationId}/cancel`,
    );
    expect(cancelled.status).toBe(201);
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.history).toHaveLength(4);

    expect(
      (await employerAgent.get(`/profiles/candidates/${candidateProfileId}`))
        .status,
    ).toBe(403);
    expect(
      (await employerAgent.get(`/applications/${applicationId}/resume`)).status,
    ).toBe(404);
    const redacted = await employerAgent.get(
      `/jobs/mine/${jobId}/applications`,
    );
    expect(redacted.body.items[0]).toMatchObject({
      status: 'cancelled',
      candidate: null,
    });
    expect(
      (await candidateAgent.get(`/applications/${applicationId}/resume`))
        .status,
    ).toBe(200);

    await snapshots.update({ applicationId }, { retentionUntil: new Date(0) });
    const competingRunner = dataSource.createQueryRunner();
    await competingRunner.connect();
    await competingRunner.query('SELECT pg_advisory_lock($1)', [73_019_301]);
    const skipped = await retention.runCycle();
    expect(skipped).toMatchObject({ acquiredLock: false, removed: 0 });
    await competingRunner.query('SELECT pg_advisory_unlock($1)', [73_019_301]);
    await competingRunner.release();

    const metrics = await retention.runCycle();
    expect(metrics).toMatchObject({
      acquiredLock: true,
      expired: 1,
      failed: 0,
      hasMore: false,
      removed: 1,
    });
    expect(retention.getLastRunMetrics()).toEqual(metrics);
    expect(
      (await candidateAgent.get(`/applications/${applicationId}/resume`))
        .status,
    ).toBe(404);
  });

  it('purges rejected applications and submitted applications from closed jobs', async () => {
    const sourceJob = await jobs.findOneByOrFail({ id: jobId });
    const sourceApplication = await applications.findOneByOrFail({
      id: applicationId,
    });
    const rejectedJob = await jobs.save(
      jobs.create({
        ...sourceJob,
        id: undefined,
        title: 'Vaga encerrada com candidatura rejeitada',
        status: 'closed',
        closedAt: new Date(),
      }),
    );
    const closedJob = await jobs.save(
      jobs.create({
        ...sourceJob,
        id: undefined,
        title: 'Vaga encerrada com candidatura submetida',
        status: 'closed',
        closedAt: new Date(),
      }),
    );
    const rejectedApplication = await applications.save(
      applications.create({
        jobId: rejectedJob.id,
        candidateProfileId: sourceApplication.candidateProfileId,
        coverMessage: null,
        status: 'rejected',
      }),
    );
    const closedApplication = await applications.save(
      applications.create({
        jobId: closedJob.id,
        candidateProfileId: sourceApplication.candidateProfileId,
        coverMessage: null,
        status: 'submitted',
      }),
    );
    const fixtures = [
      {
        applicationId: rejectedApplication.id,
        key: `applications/${sourceApplication.candidateProfileId}/${randomUUID()}.pdf`,
      },
      {
        applicationId: closedApplication.id,
        key: `applications/${sourceApplication.candidateProfileId}/${randomUUID()}.pdf`,
      },
    ];
    for (const fixture of fixtures) {
      const content = Buffer.from('%PDF-1.4\nretention fixture\n%%EOF');
      await storage.put(fixture.key, content, 'application/pdf');
      await snapshots.save(
        snapshots.create({
          applicationId: fixture.applicationId,
          originalName: 'retention-fixture.pdf',
          mimeType: 'application/pdf',
          sizeBytes: content.length,
          storageKey: fixture.key,
          retentionUntil: new Date(0),
        }),
      );
    }

    const metrics = await retention.runCycle();

    expect(metrics).toMatchObject({
      expired: 2,
      failed: 0,
      hasMore: false,
      removed: 2,
    });
    expect(await snapshots.count()).toBe(0);
  });

  it('reapplies moderation on edits and rejects concurrent decisions', async () => {
    const edited = await employerAgent.patch(`/jobs/mine/${jobId}`).send({
      ...validJob(),
      title: 'Pessoa Desenvolvedora Backend — Plataforma',
    });
    expect(edited.status).toBe(200);
    expect(edited.body.status).toBe('pending_review');
    expect(
      (await request(app.getHttpServer()).get(`/jobs/${jobId}`)).status,
    ).toBe(404);

    const decisions = await Promise.all([
      coordinatorAgent
        .post(`/moderation/jobs/${jobId}/decision`)
        .send({ decision: 'approve' }),
      coordinatorAgent.post(`/moderation/jobs/${jobId}/decision`).send({
        decision: 'request_changes',
        reason: 'Detalhar melhor os requisitos obrigatórios.',
      }),
    ]);
    expect(decisions.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);

    const stored = await jobs.findOneByOrFail({ id: jobId });
    expect(['approved', 'changes_requested']).toContain(stored.status);
    expect(await audits.countBy({ action: 'job.moderation_decided' })).toBe(2);
    const applicationAudit = await audits.findOneByOrFail({
      action: 'application.submitted',
    });
    expect(JSON.stringify(applicationAudit.context)).not.toContain(
      'Tenho interesse',
    );
  });

  function validJob() {
    return {
      title: 'Pessoa Desenvolvedora Backend',
      area: 'Tecnologia',
      description:
        'Atuação na evolução de uma plataforma digital segura, inclusiva e orientada a produto.',
      responsibilities:
        'Construir APIs, revisar código e colaborar com produto e design.',
      requirements: 'Experiência com TypeScript e bancos relacionais.',
      benefits: 'Auxílio remoto e apoio ao desenvolvimento profissional.',
      location: 'São Paulo, SP',
      workMode: 'hybrid',
      contractType: 'clt',
      seniority: 'mid',
      salaryMin: 7000,
      salaryMax: 9000,
      salaryHiddenReason: null,
      accessibilityInfo:
        'Entrevistas remotas e adaptações combinadas com cada pessoa.',
      inclusionCommitment: true,
    };
  }

  async function registerAndVerify(
    agent: TestAgent,
    email: string,
    role: 'candidate' | 'employer',
    displayName: string,
  ): Promise<void> {
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
    enableCsrfForAgent(agent, registration);
    const verification = await agent
      .post('/auth/verify-email')
      .send({ token: emailSender.tokenFor(email) });
    expect(verification.status).toBe(200);
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
      CreateJobsAndApplications1710000004000,
      HardenAbuseUploadsRetention1710000006000,
      CreateOutbox1710000007000,
      CreateIdempotencyRecords1710000008000,
    ],
  });

  await dataSource.initialize();
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
  await dataSource.runMigrations();
  await dataSource.undoLastMigration();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
