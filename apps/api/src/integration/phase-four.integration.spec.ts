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
import { CreateReportsAndGovernance1710000005000 } from '../database/migrations/1710000005000-CreateReportsAndGovernance';
import { InitializeDatabase1710000000000 } from '../database/migrations/1710000000000-InitializeDatabase';
import { EMAIL_SENDER, EmailMessage, EmailSender } from '../email/email-sender';
import { Job } from '../jobs/job.entity';
import { Report } from '../reports/report.entity';
import { User } from '../users/user.entity';
import { enableCsrfForAgent } from './csrf-test.helper';

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

integrationDescribe('Phase 4 reports, administration and audit', () => {
  jest.setTimeout(90_000);

  const emailSender = new RecordingEmailSender();
  let app: NestExpressApplication;
  let users: Repository<User>;
  let jobs: Repository<Job>;
  let reports: Repository<Report>;
  let audits: Repository<AuditEvent>;
  let candidateAgent: TestAgent;
  let employerAgent: TestAgent;
  let coordinatorAgent: TestAgent;
  let adminAgent: TestAgent;
  let candidateUserId: string;
  let employerUserId: string;
  let adminUserId: string;
  let jobId: string;
  let jobReportId: string;

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

    const dataSource = app.get(DataSource);
    users = dataSource.getRepository(User);
    jobs = dataSource.getRepository(Job);
    reports = dataSource.getRepository(Report);
    audits = dataSource.getRepository(AuditEvent);

    candidateAgent = request.agent(app.getHttpServer());
    employerAgent = request.agent(app.getHttpServer());
    coordinatorAgent = request.agent(app.getHttpServer());
    adminAgent = request.agent(app.getHttpServer());

    await registerAndVerify(
      candidateAgent,
      'phase-four-candidate@example.com',
      'candidate',
      'Pessoa Candidata',
    );
    await registerAndVerify(
      employerAgent,
      'phase-four-employer@example.com',
      'employer',
      'Pessoa Contratante',
    );
    await registerAndVerify(
      coordinatorAgent,
      'phase-four-coordinator@example.com',
      'employer',
      'Pessoa Coordenadora',
    );
    await registerAndVerify(
      adminAgent,
      'phase-four-admin@example.com',
      'employer',
      'Pessoa Administradora',
    );

    const candidate = await users.findOneByOrFail({
      email: 'phase-four-candidate@example.com',
    });
    const employer = await users.findOneByOrFail({
      email: 'phase-four-employer@example.com',
    });
    const admin = await users.findOneByOrFail({
      email: 'phase-four-admin@example.com',
    });
    candidateUserId = candidate.id;
    employerUserId = employer.id;
    adminUserId = admin.id;
    await users.update(
      { email: 'phase-four-coordinator@example.com' },
      { role: 'coordinator' },
    );
    await users.update(
      { email: 'phase-four-admin@example.com' },
      { role: 'admin' },
    );

    await candidateAgent.patch('/profiles/candidate/me').send({
      displayName: 'Pessoa Candidata',
      headline: 'Pessoa de Produto',
      bio: 'Perfil usado para validar o fluxo de governança.',
      location: 'Remoto',
      workPreferences: {
        areas: ['Produto'],
        workModes: ['remote'],
        contractTypes: ['clt'],
        availability: 'Imediata',
      },
      skills: ['Pesquisa'],
      experiences: [],
      education: [],
      professionalLinks: [],
    });
    await employerAgent.patch('/profiles/employer/me').send({
      type: 'company',
      responsibleName: 'Pessoa Contratante',
      contactEmail: 'governanca@empresa.example',
      organizationName: 'Empresa em Análise',
      segment: 'Tecnologia',
      description: 'Perfil institucional do teste de governança.',
      website: 'https://governanca.example',
      location: 'Remoto',
    });

    const created = await employerAgent.post('/jobs').send(validJob());
    jobId = created.body.id as string;
    const approved = await coordinatorAgent
      .post(`/moderation/jobs/${jobId}/decision`)
      .send({ decision: 'approve' });
    expect(approved.status).toBe(201);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('creates an authenticated report and limits the author view', async () => {
    const invalid = await candidateAgent.post('/reports').send({
      targetType: 'job',
      targetId: jobId,
      reason: 'discrimination',
      description: 'curto',
    });
    expect(invalid.status).toBe(400);

    const created = await candidateAgent.post('/reports').send({
      targetType: 'job',
      targetId: jobId,
      reason: 'discrimination',
      description:
        'A descrição da vaga contém uma condição que pode excluir pessoas de forma discriminatória.',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      targetType: 'job',
      targetId: jobId,
      reason: 'discrimination',
      status: 'open',
    });
    jobReportId = created.body.id as string;
    expect(created.body).not.toHaveProperty('description');
    expect(created.body).not.toHaveProperty('priority');

    const duplicate = await candidateAgent.post('/reports').send({
      targetType: 'job',
      targetId: jobId,
      reason: 'privacy',
      description:
        'Uma segunda tentativa não deve abrir outra denúncia ativa para o mesmo recurso.',
    });
    expect(duplicate.status).toBe(409);

    const mine = await candidateAgent.get('/reports/mine');
    expect(mine.status).toBe(200);
    expect(mine.body.items).toHaveLength(1);
    expect(mine.body.items[0]).not.toHaveProperty('description');
    expect(mine.body.items[0]).not.toHaveProperty('decisions');
  });

  it('lets coordination prioritize, review and hide reported content', async () => {
    expect((await employerAgent.get('/moderation/reports')).status).toBe(403);

    const queue = await coordinatorAgent
      .get('/moderation/reports')
      .query({ status: 'open', priority: 'high' });
    expect(queue.status).toBe(200);
    expect(queue.body.items[0]).toMatchObject({
      id: jobReportId,
      priority: 'high',
      reporter: { displayName: 'Pessoa Candidata' },
    });
    expect(queue.body.items[0].description).toContain('discriminatória');

    const prioritized = await coordinatorAgent
      .patch(`/moderation/reports/${jobReportId}/priority`)
      .send({ priority: 'urgent' });
    expect(prioritized.status).toBe(200);
    expect(prioritized.body.priority).toBe('urgent');

    const reviewing = await coordinatorAgent
      .post(`/moderation/reports/${jobReportId}/decision`)
      .send({
        action: 'start_review',
        reason: 'Conteúdo encaminhado para análise prioritária da equipe.',
      });
    expect(reviewing.status).toBe(201);
    expect(reviewing.body.status).toBe('in_review');

    const hidden = await coordinatorAgent
      .post(`/moderation/reports/${jobReportId}/decision`)
      .send({
        action: 'hide_job',
        reason:
          'A vaga ficará indisponível até a correção do conteúdo apontado.',
      });
    expect(hidden.status).toBe(201);
    expect(hidden.body.status).toBe('resolved');
    expect(hidden.body.decisions).toHaveLength(2);
    expect((await jobs.findOneByOrFail({ id: jobId })).status).toBe('reported');
    expect(
      (await request(app.getHttpServer()).get(`/jobs/${jobId}`)).status,
    ).toBe(404);
  });

  it('serializes concurrent final decisions', async () => {
    const second = await employerAgent.post('/reports').send({
      targetType: 'user',
      targetId: candidateUserId,
      reason: 'harassment',
      description:
        'Relato de comportamento inadequado durante uma interação ligada ao processo seletivo.',
    });
    expect(second.status).toBe(201);
    const reportId = second.body.id as string;

    const decisions = await Promise.all([
      coordinatorAgent.post(`/moderation/reports/${reportId}/decision`).send({
        action: 'resolve',
        reason: 'Relato confirmado e encaminhado para acompanhamento interno.',
      }),
      coordinatorAgent.post(`/moderation/reports/${reportId}/decision`).send({
        action: 'dismiss',
        reason: 'Não foram encontradas evidências suficientes nesta análise.',
      }),
    ]);
    expect(decisions.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(['resolved', 'dismissed']).toContain(
      (await reports.findOneByOrFail({ id: reportId })).status,
    );
  });

  it('restricts user administration and audit to admins', async () => {
    expect((await coordinatorAgent.get('/users')).status).toBe(403);
    expect((await coordinatorAgent.get('/audit-events')).status).toBe(403);
    expect(
      (
        await coordinatorAgent.patch(`/users/${employerUserId}/role`).send({
          role: 'coordinator',
          reason: 'Tentativa sem autorização administrativa suficiente.',
        })
      ).status,
    ).toBe(403);

    const listed = await adminAgent
      .get('/users')
      .query({ q: 'phase-four-candidate', role: 'candidate' });
    expect(listed.status).toBe(200);
    expect(listed.body.items[0]).toMatchObject({
      id: candidateUserId,
      role: 'candidate',
      status: 'active',
    });

    const promoted = await adminAgent
      .patch(`/users/${employerUserId}/role`)
      .send({
        role: 'coordinator',
        reason: 'Promoção controlada para apoiar a operação de moderação.',
      });
    expect(promoted.status).toBe(200);
    expect(promoted.body.role).toBe('coordinator');

    const selfDemotion = await adminAgent
      .patch(`/users/${adminUserId}/role`)
      .send({
        role: 'coordinator',
        reason: 'Uma conta administrativa não pode remover o próprio acesso.',
      });
    expect(selfDemotion.status).toBe(400);

    const selfSuspension = await adminAgent
      .patch(`/users/${adminUserId}/status`)
      .send({
        status: 'suspended',
        reason: 'Uma conta administrativa não pode suspender a própria sessão.',
      });
    expect(selfSuspension.status).toBe(400);

    const suspended = await adminAgent
      .patch(`/users/${candidateUserId}/status`)
      .send({
        status: 'suspended',
        reason: 'Suspensão temporária após decisão administrativa registrada.',
      });
    expect(suspended.status).toBe(200);
    expect(suspended.body.status).toBe('suspended');

    const blocked = await candidateAgent.get('/reports/mine');
    expect([401, 403]).toContain(blocked.status);

    const audit = await adminAgent
      .get('/audit-events')
      .query({ action: 'report.decision_recorded' });
    expect(audit.status).toBe(200);
    expect(audit.body.total).toBeGreaterThanOrEqual(2);
    expect(audit.body.items[0]).not.toHaveProperty('ipAddress');
    expect(audit.body.items[0]).not.toHaveProperty('userAgent');

    const createdAudit = await audits.findOneByOrFail({
      action: 'report.created',
    });
    expect(JSON.stringify(createdAudit.context)).not.toContain(
      'condição que pode excluir',
    );
  });

  function validJob() {
    return {
      title: 'Pessoa Analista de Produto',
      area: 'Produto',
      description:
        'Oportunidade para atuar com descoberta, métricas e evolução contínua de um produto digital.',
      responsibilities:
        'Conduzir análises, colaborar com design e apoiar decisões do time.',
      requirements: 'Experiência com produto digital e comunicação clara.',
      benefits: 'Auxílio remoto e apoio ao desenvolvimento.',
      location: 'Remoto',
      workMode: 'remote',
      contractType: 'clt',
      seniority: 'mid',
      salaryMin: 6000,
      salaryMax: 8000,
      salaryHiddenReason: null,
      accessibilityInfo: 'Processo remoto com adaptações sob demanda.',
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
      CreateReportsAndGovernance1710000005000,
    ],
  });

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
  await dataSource.undoLastMigration();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
