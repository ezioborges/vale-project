import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  ApplicationStatus,
  CandidateApplication,
  CandidateApplicationPage,
  JobModerationDecision,
  JobStatus,
  ManagedJob,
  ManagedJobPage,
  PublicJob,
  PublicJobPage,
  ReceivedApplication,
  ReceivedApplicationPage,
} from '@vale/shared';
import {
  DataSource,
  EntityManager,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { Env } from '../common/config/env.validation';
import { IdempotencyService } from '../common/idempotency/idempotency.service';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';
import { CandidateProfile } from '../profiles/candidate-profile.entity';
import { EmployerProfile } from '../profiles/employer-profile.entity';
import { FILE_STORAGE, FileStorage } from '../profiles/file-storage';
import { ProfileAsset } from '../profiles/profile-asset.entity';
import { ApplicationResumeSnapshot } from './application-resume-snapshot.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';
import { Application } from './application.entity';
import {
  ApplicationListQueryDto,
  JobInputDto,
  JobSearchQueryDto,
  ModerationQueueQueryDto,
  PaginationQueryDto,
} from './dto/job.dto';
import { activeJobStatuses } from './job.constants';
import { Job } from './job.entity';

export type JobRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type ApplicationResumeDownload = {
  content: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(ApplicationStatusHistory)
    private readonly historyRepository: Repository<ApplicationStatusHistory>,
    @InjectRepository(ApplicationResumeSnapshot)
    private readonly snapshotRepository: Repository<ApplicationResumeSnapshot>,
    @InjectRepository(CandidateProfile)
    private readonly candidateRepository: Repository<CandidateProfile>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepository: Repository<EmployerProfile>,
    @InjectRepository(ProfileAsset)
    private readonly assetRepository: Repository<ProfileAsset>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService<Env, true>,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    private readonly rateLimitService: RateLimitService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async createJob(
    owner: AuthenticatedUser,
    input: JobInputDto,
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    return (await this.createJobIdempotent(owner, input, context)).job;
  }

  async createJobIdempotent(
    owner: AuthenticatedUser,
    input: JobInputDto,
    context: JobRequestContext,
    idempotencyKey?: string,
  ): Promise<{ job: ManagedJob; replayed: boolean }> {
    this.assertJobInput(input);
    const execution = await this.idempotencyService.execute(
      {
        actorUserId: owner.id,
        method: 'POST',
        route: '/jobs',
        key: idempotencyKey,
        payload: input,
        resourceType: 'job',
        contractVersion: 'v1',
      },
      (manager) => this.createJobInTransaction(manager, owner, input, context),
    );

    return {
      job: await this.getManagedJob(execution.resourceId, owner, false),
      replayed: execution.replayed,
    };
  }

  private async createJobInTransaction(
    manager: EntityManager,
    owner: AuthenticatedUser,
    input: JobInputDto,
    context: JobRequestContext,
  ): Promise<string> {
    const saved = await (async () => {
      const employer = await manager.getRepository(EmployerProfile).findOne({
        where: { userId: owner.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!employer) {
        throw new BadRequestException(
          'Complete o perfil institucional antes de enviar uma vaga.',
        );
      }

      const activeCount = await manager.getRepository(Job).count({
        where: {
          ownerUserId: owner.id,
          status: In([...activeJobStatuses]),
        },
      });
      const limit = this.configService.get('JOB_ACTIVE_LIMIT', { infer: true });
      if (activeCount >= limit) {
        throw new ConflictException(
          `O limite de ${limit} vagas simultâneas em análise ou publicação foi atingido.`,
        );
      }

      const repository = manager.getRepository(Job);
      const job = repository.create({
        employerProfileId: employer.id,
        ownerUserId: owner.id,
        status: 'pending_review',
        moderationReason: null,
        moderatedAt: null,
        moderatedByUserId: null,
        publishedAt: null,
        closedAt: null,
      });
      this.applyJobInput(job, input);
      const result = await repository.save(job);
      await this.recordAudit(
        manager,
        owner.id,
        owner.id,
        'job.created',
        { jobId: result.id, status: result.status },
        context,
      );
      return result;
    })();
    return saved.id;
  }

  async listMyJobs(
    owner: AuthenticatedUser,
    query: PaginationQueryDto,
  ): Promise<ManagedJobPage> {
    const [items, total] = await this.jobRepository.findAndCount({
      where: { ownerUserId: owner.id },
      relations: { employerProfile: true },
      order: { createdAt: 'DESC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.page(
      items.map((job) => this.toManagedJob(job)),
      total,
      query,
    );
  }

  async getManagedJob(
    jobId: string,
    viewer: AuthenticatedUser,
    allowTeam = true,
  ): Promise<ManagedJob> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: { employerProfile: true },
    });
    if (
      !job ||
      (job.ownerUserId !== viewer.id &&
        (!allowTeam ||
          (viewer.role !== 'admin' && viewer.role !== 'coordinator')))
    ) {
      throw new NotFoundException('Vaga não encontrada.');
    }
    return this.toManagedJob(job);
  }

  async updateJob(
    jobId: string,
    owner: AuthenticatedUser,
    input: JobInputDto,
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    this.assertJobInput(input);
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Job);
      const job = await repository.findOne({
        where: { id: jobId, ownerUserId: owner.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job) throw new NotFoundException('Vaga não encontrada.');
      if (job.status !== 'changes_requested' && job.status !== 'approved') {
        throw new ConflictException(
          'A vaga só pode ser editada após pedido de ajustes ou enquanto publicada.',
        );
      }

      const changedFields = this.changedJobFields(job, input);
      this.applyJobInput(job, input);
      job.status = 'pending_review';
      job.moderationReason = null;
      job.moderatedAt = null;
      job.moderatedByUserId = null;
      job.publishedAt = null;
      await repository.save(job);
      await this.recordAudit(
        manager,
        owner.id,
        owner.id,
        'job.updated',
        { jobId: job.id, status: job.status, changedFields },
        context,
      );
    });
    return this.getManagedJob(jobId, owner, false);
  }

  pauseJob(
    jobId: string,
    owner: AuthenticatedUser,
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    return this.transitionOwnedJob(
      jobId,
      owner,
      ['approved'],
      'paused',
      'job.paused',
      context,
    );
  }

  resumeJob(
    jobId: string,
    owner: AuthenticatedUser,
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    return this.transitionOwnedJob(
      jobId,
      owner,
      ['paused'],
      'approved',
      'job.resumed',
      context,
    );
  }

  closeJob(
    jobId: string,
    owner: AuthenticatedUser,
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    return this.transitionOwnedJob(
      jobId,
      owner,
      ['approved', 'paused'],
      'closed',
      'job.closed',
      context,
    );
  }

  republishJob(
    jobId: string,
    owner: AuthenticatedUser,
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    return this.transitionOwnedJob(
      jobId,
      owner,
      ['closed'],
      'pending_review',
      'job.republished',
      context,
    );
  }

  async listModerationQueue(
    query: ModerationQueueQueryDto,
  ): Promise<ManagedJobPage> {
    const [items, total] = await this.jobRepository.findAndCount({
      where: { status: query.status },
      relations: { employerProfile: true },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.page(
      items.map((job) => this.toManagedJob(job)),
      total,
      query,
    );
  }

  async moderateJob(
    jobId: string,
    moderator: AuthenticatedUser,
    decision: JobModerationDecision,
    reason: string | undefined,
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    const cleanReason = this.cleanNullable(reason);
    if (decision !== 'approve' && (!cleanReason || cleanReason.length < 10)) {
      throw new BadRequestException(
        'Informe um motivo com pelo menos 10 caracteres.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Job);
      const job = await repository.findOne({
        where: { id: jobId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job) throw new NotFoundException('Vaga não encontrada.');
      if (job.status !== 'pending_review') {
        throw new ConflictException(
          'Esta vaga já recebeu uma decisão ou saiu da fila.',
        );
      }

      const nextStatus: JobStatus =
        decision === 'approve'
          ? 'approved'
          : decision === 'request_changes'
            ? 'changes_requested'
            : 'rejected';
      job.status = nextStatus;
      job.moderationReason = decision === 'approve' ? null : cleanReason;
      job.moderatedByUserId = moderator.id;
      job.moderatedAt = new Date();
      job.publishedAt = decision === 'approve' ? new Date() : null;
      await repository.save(job);
      await this.recordAudit(
        manager,
        moderator.id,
        job.ownerUserId,
        'job.moderation_decided',
        { jobId: job.id, decision, status: nextStatus },
        context,
      );
    });
    return this.getManagedJob(jobId, moderator);
  }

  async searchPublicJobs(query: JobSearchQueryDto): Promise<PublicJobPage> {
    const builder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.employerProfile', 'employer')
      .where('job.status = :approved', { approved: 'approved' });

    if (query.q?.trim()) {
      const value = `%${this.escapeLike(query.q.trim())}%`;
      builder.andWhere(
        `(
          job.title ILIKE :q ESCAPE '\\' OR
          job.description ILIKE :q ESCAPE '\\' OR
          job.area ILIKE :q ESCAPE '\\' OR
          employer.organizationName ILIKE :q ESCAPE '\\'
        )`,
        { q: value },
      );
    }
    if (query.area?.trim()) {
      builder.andWhere('job.areaNormalized = :area', {
        area: this.normalizeFilter(query.area),
      });
    }
    if (query.location?.trim()) {
      builder.andWhere(`job.location ILIKE :location ESCAPE '\\'`, {
        location: `%${this.escapeLike(query.location.trim())}%`,
      });
    }
    if (query.workMode) {
      builder.andWhere('job.workMode = :workMode', {
        workMode: query.workMode,
      });
    }
    if (query.contractType) {
      builder.andWhere('job.contractType = :contractType', {
        contractType: query.contractType,
      });
    }
    if (query.seniority) {
      builder.andWhere('job.seniority = :seniority', {
        seniority: query.seniority,
      });
    }

    const [items, total] = await builder
      .orderBy('job.publishedAt', 'DESC')
      .addOrderBy('job.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return this.page(
      items.map((job) => this.toPublicJob(job)),
      total,
      query,
    );
  }

  async getPublicJob(jobId: string): Promise<PublicJob> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, status: 'approved' },
      relations: { employerProfile: true },
    });
    if (!job) throw new NotFoundException('Vaga indisponível.');
    return this.toPublicJob(job);
  }

  async submitApplication(
    jobId: string,
    candidate: AuthenticatedUser,
    coverMessage: string | null | undefined,
    context: JobRequestContext,
  ): Promise<CandidateApplication> {
    return (
      await this.submitApplicationIdempotent(
        jobId,
        candidate,
        coverMessage,
        context,
      )
    ).application;
  }

  async submitApplicationIdempotent(
    jobId: string,
    candidate: AuthenticatedUser,
    coverMessage: string | null | undefined,
    context: JobRequestContext,
    idempotencyKey?: string,
  ): Promise<{ application: CandidateApplication; replayed: boolean }> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, status: 'approved' },
      relations: { employerProfile: true },
    });
    if (!job) {
      throw new ConflictException('Esta vaga não está recebendo candidaturas.');
    }
    const profile = await this.candidateRepository.findOneBy({
      userId: candidate.id,
    });
    if (!profile?.isActive) {
      throw new BadRequestException(
        'Ative e complete seu perfil antes de se candidatar.',
      );
    }
    if (profile.visibility === 'private') {
      throw new ForbiddenException(
        'Revise a visibilidade do perfil antes de compartilhar seus dados.',
      );
    }
    if (
      profile.visibility === 'verified_employers' &&
      !job.employerProfile.isVerified
    ) {
      throw new ForbiddenException(
        'Este contratante ainda não é verificado. Escolha applications_only conscientemente para prosseguir.',
      );
    }

    const resume = await this.assetRepository.findOneBy({
      userId: candidate.id,
      kind: 'resume',
    });
    if (!resume) {
      throw new BadRequestException(
        'Envie um currículo PDF antes de se candidatar.',
      );
    }

    const execution = await this.idempotencyService.execute(
      {
        actorUserId: candidate.id,
        method: 'POST',
        route: '/applications',
        key: idempotencyKey,
        payload: { coverMessage: this.cleanNullable(coverMessage), jobId },
        resourceType: 'application',
        contractVersion: 'v1',
      },
      async (manager, idempotencyRecordId) => {
        const applicationId = idempotencyRecordId ?? randomUUID();
        const snapshotKey = `applications/${candidate.id}/${applicationId}.pdf`;
        let snapshotUploaded = false;
        try {
          const lockedJob = await manager.getRepository(Job).findOne({
            where: { id: jobId },
            lock: { mode: 'pessimistic_read' },
          });
          if (lockedJob?.status !== 'approved') {
            throw new ConflictException(
              'Esta vaga deixou de receber candidaturas.',
            );
          }

          const repository = manager.getRepository(Application);
          const application = await repository.save(
            repository.create({
              id: applicationId,
              jobId,
              candidateProfileId: profile.id,
              coverMessage: this.cleanNullable(coverMessage),
              status: 'submitted',
            }),
          );
          const resumeContent = await this.storage.get(resume.storageKey);
          await this.storage.put(snapshotKey, resumeContent, resume.mimeType);
          snapshotUploaded = true;
          await manager.getRepository(ApplicationResumeSnapshot).save({
            applicationId: application.id,
            originalName: resume.originalName,
            mimeType: resume.mimeType,
            sizeBytes: resume.sizeBytes,
            storageKey: snapshotKey,
            retentionUntil: new Date(
              Date.now() +
                this.configService.get('APPLICATION_RESUME_RETENTION_DAYS', {
                  infer: true,
                }) *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
          });
          await manager.getRepository(ApplicationStatusHistory).save({
            applicationId: application.id,
            actorUserId: candidate.id,
            fromStatus: null,
            toStatus: 'submitted',
          });
          await this.recordAudit(
            manager,
            candidate.id,
            candidate.id,
            'application.submitted',
            { jobId, applicationId: application.id },
            context,
          );
          return application.id;
        } catch (error) {
          if (snapshotUploaded) {
            await this.storage.delete(snapshotKey).catch(() => undefined);
          }
          if (
            error instanceof QueryFailedError &&
            (error.driverError as { code?: string }).code === '23505'
          ) {
            throw new ConflictException('Você já se candidatou a esta vaga.');
          }
          throw error;
        }
      },
    );

    return {
      application: await this.getCandidateApplication(
        execution.resourceId,
        candidate.id,
      ),
      replayed: execution.replayed,
    };
  }

  async listMyApplications(
    candidate: AuthenticatedUser,
    query: ApplicationListQueryDto,
  ): Promise<CandidateApplicationPage> {
    const profile = await this.candidateRepository.findOneBy({
      userId: candidate.id,
    });
    if (!profile) {
      return this.page([], 0, query);
    }

    const builder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.employerProfile', 'employer')
      .leftJoinAndSelect('application.history', 'history')
      .leftJoinAndSelect('application.resumeSnapshot', 'snapshot')
      .where('application.candidateProfileId = :profileId', {
        profileId: profile.id,
      });
    if (query.status) {
      builder.andWhere('application.status = :status', {
        status: query.status,
      });
    }
    const [items, total] = await builder
      .orderBy('application.submittedAt', 'DESC')
      .addOrderBy('application.id', 'ASC')
      .addOrderBy('history.changedAt', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return this.page(
      items.map((application) => this.toCandidateApplication(application)),
      total,
      query,
    );
  }

  async cancelApplication(
    applicationId: string,
    candidate: AuthenticatedUser,
    context: JobRequestContext,
  ): Promise<CandidateApplication> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Application);
      const application = await repository.findOne({
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!application) {
        throw new NotFoundException('Candidatura não encontrada.');
      }
      const profile = await manager.getRepository(CandidateProfile).findOneBy({
        id: application.candidateProfileId,
        userId: candidate.id,
      });
      if (!profile) {
        throw new NotFoundException('Candidatura não encontrada.');
      }
      const job = await manager.getRepository(Job).findOneBy({
        id: application.jobId,
      });
      if (job?.status !== 'approved') {
        throw new ConflictException(
          'A candidatura não pode ser cancelada após o encerramento da vaga.',
        );
      }
      if (
        !['submitted', 'under_review', 'shortlisted'].includes(
          application.status,
        )
      ) {
        throw new ConflictException(
          'Esta candidatura já está em estado terminal.',
        );
      }

      const fromStatus = application.status;
      application.status = 'cancelled';
      await repository.save(application);
      await this.saveHistory(
        manager,
        application.id,
        candidate.id,
        fromStatus,
        'cancelled',
      );
      await this.recordAudit(
        manager,
        candidate.id,
        candidate.id,
        'application.cancelled',
        { applicationId, jobId: application.jobId },
        context,
      );
    });
    return this.getCandidateApplication(applicationId, candidate.id);
  }

  async listReceivedApplications(
    jobId: string,
    owner: AuthenticatedUser,
    query: ApplicationListQueryDto,
  ): Promise<ReceivedApplicationPage> {
    const ownsJob = await this.jobRepository.exist({
      where: { id: jobId, ownerUserId: owner.id },
    });
    if (!ownsJob) throw new NotFoundException('Vaga não encontrada.');

    const builder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.candidateProfile', 'candidate')
      .leftJoinAndSelect('application.history', 'history')
      .leftJoinAndSelect('application.resumeSnapshot', 'snapshot')
      .where('application.jobId = :jobId', { jobId });
    if (query.status) {
      builder.andWhere('application.status = :status', {
        status: query.status,
      });
    }
    const [items, total] = await builder
      .orderBy('application.submittedAt', 'ASC')
      .addOrderBy('application.id', 'ASC')
      .addOrderBy('history.changedAt', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return this.page(
      items.map((application) => this.toReceivedApplication(application)),
      total,
      query,
    );
  }

  async updateApplicationStatus(
    applicationId: string,
    owner: AuthenticatedUser,
    nextStatus: 'under_review' | 'shortlisted' | 'rejected',
    context: JobRequestContext,
  ): Promise<ReceivedApplication> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Application);
      const application = await repository.findOne({
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!application) {
        throw new NotFoundException('Candidatura não encontrada.');
      }
      const job = await manager.getRepository(Job).findOneBy({
        id: application.jobId,
        ownerUserId: owner.id,
      });
      if (!job) throw new NotFoundException('Candidatura não encontrada.');

      const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
        submitted: ['under_review', 'shortlisted', 'rejected'],
        under_review: ['shortlisted', 'rejected'],
        shortlisted: ['rejected'],
        rejected: [],
        cancelled: [],
      };
      if (!transitions[application.status].includes(nextStatus)) {
        throw new ConflictException(
          'A transição solicitada não é permitida para esta candidatura.',
        );
      }

      const fromStatus = application.status;
      application.status = nextStatus;
      await repository.save(application);
      await this.saveHistory(
        manager,
        application.id,
        owner.id,
        fromStatus,
        nextStatus,
      );
      await this.recordAudit(
        manager,
        owner.id,
        job.ownerUserId,
        'application.status_changed',
        { applicationId, jobId: job.id, fromStatus, toStatus: nextStatus },
        context,
      );
    });
    return this.getReceivedApplication(applicationId, owner.id);
  }

  async downloadApplicationResume(
    applicationId: string,
    viewer: AuthenticatedUser,
    context: JobRequestContext,
  ): Promise<ApplicationResumeDownload> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: {
        candidateProfile: true,
        job: true,
        resumeSnapshot: true,
      },
    });
    if (!application?.resumeSnapshot) {
      throw new NotFoundException('Currículo da candidatura não encontrado.');
    }

    const isCandidate = application.candidateProfile.userId === viewer.id;
    const isTeam = viewer.role === 'admin' || viewer.role === 'coordinator';
    const isEmployer =
      application.job.ownerUserId === viewer.id &&
      application.status !== 'cancelled';
    if (!isCandidate && !isTeam && !isEmployer) {
      throw new NotFoundException('Currículo da candidatura não encontrado.');
    }

    const snapshot = application.resumeSnapshot;
    await this.rateLimitService.enforce({
      identity: `user:${viewer.id}:purpose:application-resume`,
      policyName: 'applications:resume-download:volume',
      limit: 500,
      windowSeconds: 86_400,
      cost: Math.max(1, Math.ceil(snapshot.sizeBytes / 1024 / 1024)),
    });
    await this.auditService.record({
      actorUserId: viewer.id,
      targetUserId: application.candidateProfile.userId,
      action: 'application.resume_downloaded',
      context: { applicationId, jobId: application.jobId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return {
      content: await this.storage.get(snapshot.storageKey),
      fileName: snapshot.originalName,
      mimeType: snapshot.mimeType,
      sizeBytes: snapshot.sizeBytes,
    };
  }

  private async transitionOwnedJob(
    jobId: string,
    owner: AuthenticatedUser,
    allowedFrom: JobStatus[],
    nextStatus: JobStatus,
    action: 'job.paused' | 'job.resumed' | 'job.closed' | 'job.republished',
    context: JobRequestContext,
  ): Promise<ManagedJob> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Job);
      const job = await repository.findOne({
        where: { id: jobId, ownerUserId: owner.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job) throw new NotFoundException('Vaga não encontrada.');
      if (!allowedFrom.includes(job.status)) {
        throw new ConflictException('Esta transição de vaga não é permitida.');
      }

      const fromStatus = job.status;
      job.status = nextStatus;
      if (nextStatus === 'closed') job.closedAt = new Date();
      if (nextStatus === 'pending_review') {
        job.closedAt = null;
        job.publishedAt = null;
        job.moderationReason = null;
        job.moderatedAt = null;
        job.moderatedByUserId = null;
      }
      await repository.save(job);
      await this.recordAudit(
        manager,
        owner.id,
        owner.id,
        action,
        { jobId, fromStatus, toStatus: nextStatus },
        context,
      );
    });
    return this.getManagedJob(jobId, owner, false);
  }

  private async getCandidateApplication(
    applicationId: string,
    candidateUserId: string,
  ): Promise<CandidateApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: {
        candidateProfile: true,
        job: { employerProfile: true },
        history: true,
        resumeSnapshot: true,
      },
    });
    if (
      !application ||
      application.candidateProfile.userId !== candidateUserId
    ) {
      throw new NotFoundException('Candidatura não encontrada.');
    }
    return this.toCandidateApplication(application);
  }

  private async getReceivedApplication(
    applicationId: string,
    employerUserId: string,
  ): Promise<ReceivedApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: {
        candidateProfile: true,
        job: true,
        history: true,
        resumeSnapshot: true,
      },
    });
    if (!application || application.job.ownerUserId !== employerUserId) {
      throw new NotFoundException('Candidatura não encontrada.');
    }
    return this.toReceivedApplication(application);
  }

  private async saveHistory(
    manager: EntityManager,
    applicationId: string,
    actorUserId: string,
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
  ): Promise<void> {
    await manager.getRepository(ApplicationStatusHistory).save({
      applicationId,
      actorUserId,
      fromStatus,
      toStatus,
    });
  }

  private assertJobInput(input: JobInputDto): void {
    const hasMinimum = input.salaryMin !== null;
    const hasMaximum = input.salaryMax !== null;
    if (
      hasMinimum !== hasMaximum ||
      (input.salaryMin !== null &&
        input.salaryMax !== null &&
        input.salaryMin > input.salaryMax)
    ) {
      throw new BadRequestException('Informe uma faixa salarial válida.');
    }
    const hiddenReason = this.cleanNullable(input.salaryHiddenReason);
    if (!hasMinimum && (!hiddenReason || hiddenReason.length < 10)) {
      throw new BadRequestException(
        'Explique por que a faixa salarial não foi informada.',
      );
    }
    if (hasMinimum && hiddenReason) {
      throw new BadRequestException(
        'Não combine faixa salarial com justificativa de ocultação.',
      );
    }
    if (!input.inclusionCommitment) {
      throw new BadRequestException(
        'O compromisso com as diretrizes inclusivas é obrigatório.',
      );
    }
  }

  private applyJobInput(job: Job, input: JobInputDto): void {
    job.title = this.cleanRequired(input.title);
    job.area = this.cleanRequired(input.area);
    job.areaNormalized = this.normalizeFilter(input.area);
    job.description = input.description.trim();
    job.responsibilities = this.cleanNullable(input.responsibilities);
    job.requirements = this.cleanNullable(input.requirements);
    job.benefits = this.cleanNullable(input.benefits);
    job.location = this.cleanRequired(input.location);
    job.workMode = input.workMode;
    job.contractType = input.contractType;
    job.seniority = input.seniority;
    job.salaryMin = input.salaryMin;
    job.salaryMax = input.salaryMax;
    job.salaryHiddenReason = this.cleanNullable(input.salaryHiddenReason);
    job.accessibilityInfo = this.cleanNullable(input.accessibilityInfo);
    job.inclusionCommitment = input.inclusionCommitment;
  }

  private changedJobFields(job: Job, input: JobInputDto): string[] {
    const fields: Array<keyof JobInputDto> = [
      'title',
      'area',
      'description',
      'responsibilities',
      'requirements',
      'benefits',
      'location',
      'workMode',
      'contractType',
      'seniority',
      'salaryMin',
      'salaryMax',
      'salaryHiddenReason',
      'accessibilityInfo',
      'inclusionCommitment',
    ];
    return fields.filter(
      (field) =>
        JSON.stringify(job[field as keyof Job]) !==
        JSON.stringify(input[field]),
    );
  }

  private toPublicJob(job: Job): PublicJob {
    return {
      ...this.baseJobResponse(job),
      status: 'approved',
    };
  }

  private toManagedJob(job: Job): ManagedJob {
    return {
      ...this.baseJobResponse(job),
      status: job.status,
      moderationReason: job.moderationReason,
      moderatedAt: job.moderatedAt?.toISOString() ?? null,
      closedAt: job.closedAt?.toISOString() ?? null,
    };
  }

  private baseJobResponse(job: Job) {
    return {
      id: job.id,
      title: job.title,
      area: job.area,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: job.benefits,
      location: job.location,
      workMode: job.workMode,
      contractType: job.contractType,
      seniority: job.seniority,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryHiddenReason: job.salaryHiddenReason,
      accessibilityInfo: job.accessibilityInfo,
      inclusionCommitment: job.inclusionCommitment,
      employer: {
        id: job.employerProfile.id,
        displayName:
          job.employerProfile.organizationName ??
          job.employerProfile.responsibleName,
        isVerified: job.employerProfile.isVerified,
      },
      publishedAt: job.publishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  private toCandidateApplication(
    application: Application,
  ): CandidateApplication {
    return {
      id: application.id,
      status: application.status,
      coverMessage: application.coverMessage,
      resumeFileName: application.resumeSnapshot?.originalName ?? null,
      submittedAt: application.submittedAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      job: {
        id: application.job.id,
        title: application.job.title,
        status: application.job.status,
        employerName:
          application.job.employerProfile.organizationName ??
          application.job.employerProfile.responsibleName,
      },
      history: this.mapHistory(application.history),
    };
  }

  private toReceivedApplication(application: Application): ReceivedApplication {
    return {
      id: application.id,
      status: application.status,
      coverMessage: application.coverMessage,
      resumeFileName: application.resumeSnapshot?.originalName ?? null,
      resumeDownloadPath: application.resumeSnapshot
        ? `/applications/${application.id}/resume`
        : null,
      submittedAt: application.submittedAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      candidate:
        application.status === 'cancelled'
          ? null
          : {
              id: application.candidateProfile.id,
              displayName: application.candidateProfile.displayName,
              headline: application.candidateProfile.headline,
              location: application.candidateProfile.location,
              skills: application.candidateProfile.skills,
            },
      history: this.mapHistory(application.history),
    };
  }

  private mapHistory(history: ApplicationStatusHistory[]) {
    return [...history]
      .sort(
        (left, right) =>
          left.changedAt.getTime() - right.changedAt.getTime() ||
          left.id.localeCompare(right.id),
      )
      .map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        changedAt: entry.changedAt.toISOString(),
      }));
  }

  private page<T>(
    items: T[],
    total: number,
    query: PaginationQueryDto,
  ): {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } {
    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }

  private recordAudit(
    manager: EntityManager,
    actorUserId: string,
    targetUserId: string,
    action:
      | 'job.created'
      | 'job.updated'
      | 'job.moderation_decided'
      | 'job.paused'
      | 'job.resumed'
      | 'job.closed'
      | 'job.republished'
      | 'application.submitted'
      | 'application.status_changed'
      | 'application.cancelled',
    auditContext: Record<string, unknown>,
    requestContext: JobRequestContext,
  ) {
    return this.auditService.record(
      {
        actorUserId,
        targetUserId,
        action,
        context: auditContext,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      },
      manager,
    );
  }

  private normalizeFilter(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private cleanRequired(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private cleanNullable(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const clean = value.trim().replace(/\s+/g, ' ');
    return clean || null;
  }
}
