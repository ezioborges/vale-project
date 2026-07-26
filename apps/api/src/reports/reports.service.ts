import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  ModerationReport,
  ModerationReportPage,
  MyReport,
  MyReportPage,
  ReportDecisionAction,
  ReportPriority,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@vale/shared';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { Application } from '../jobs/application.entity';
import { Job } from '../jobs/job.entity';
import { CandidateProfile } from '../profiles/candidate-profile.entity';
import { EmployerProfile } from '../profiles/employer-profile.entity';
import { User } from '../users/user.entity';
import { ModerationReportsQueryDto, MyReportsQueryDto } from './dto/report.dto';
import { ModerationDecision } from './moderation-decision.entity';
import { Report } from './report.entity';

export type ReportRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(CandidateProfile)
    private readonly candidateRepository: Repository<CandidateProfile>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepository: Repository<EmployerProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async create(
    reporter: AuthenticatedUser,
    input: {
      targetType: ReportTargetType;
      targetId: string;
      reason: ReportReason;
      description: string;
    },
    context: ReportRequestContext,
  ): Promise<MyReport> {
    const targetUserId = await this.resolveTargetUser(
      input.targetType,
      input.targetId,
      reporter,
    );
    if (targetUserId === reporter.id && input.targetType !== 'application') {
      throw new BadRequestException(
        'Você não pode denunciar o próprio recurso.',
      );
    }

    try {
      const report = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Report);
        const saved = await repository.save(
          repository.create({
            reporterUserId: reporter.id,
            targetUserId,
            targetType: input.targetType,
            targetId: input.targetId,
            reason: input.reason,
            description: input.description.trim(),
            status: 'open',
            priority: this.initialPriority(input.reason),
            reviewedAt: null,
          }),
        );
        await this.auditService.record(
          {
            actorUserId: reporter.id,
            targetUserId,
            action: 'report.created',
            context: {
              reportId: saved.id,
              targetType: saved.targetType,
              targetId: saved.targetId,
              reason: saved.reason,
            },
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          manager,
        );
        return saved;
      });
      return this.toMyReport(report);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Já existe uma denúncia aberta por você para este recurso.',
        );
      }
      throw error;
    }
  }

  async listMine(
    reporter: AuthenticatedUser,
    query: MyReportsQueryDto,
  ): Promise<MyReportPage> {
    const builder = this.reportRepository
      .createQueryBuilder('report')
      .where('report.reporterUserId = :reporterUserId', {
        reporterUserId: reporter.id,
      });
    if (query.status) {
      builder.andWhere('report.status = :status', { status: query.status });
    }
    const [items, total] = await builder
      .orderBy('report.createdAt', 'DESC')
      .addOrderBy('report.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return this.page(
      items.map((report) => this.toMyReport(report)),
      total,
      query,
    );
  }

  async listForModeration(
    query: ModerationReportsQueryDto,
  ): Promise<ModerationReportPage> {
    const builder = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.decisions', 'decisions')
      .addSelect(
        `CASE report.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          ELSE 4
        END`,
        'priority_rank',
      );
    if (query.status) {
      builder.andWhere('report.status = :status', { status: query.status });
    }
    if (query.priority) {
      builder.andWhere('report.priority = :priority', {
        priority: query.priority,
      });
    }
    if (query.targetType) {
      builder.andWhere('report.targetType = :targetType', {
        targetType: query.targetType,
      });
    }
    const [items, total] = await builder
      .orderBy('priority_rank', 'ASC')
      .addOrderBy('report.createdAt', 'ASC')
      .addOrderBy('report.id', 'ASC')
      .addOrderBy('decisions.createdAt', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return this.page(
      items.map((report) => this.toModerationReport(report)),
      total,
      query,
    );
  }

  async getForModeration(reportId: string): Promise<ModerationReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: { reporter: true, decisions: true },
    });
    if (!report) throw new NotFoundException('Denúncia não encontrada.');
    return this.toModerationReport(report);
  }

  async updatePriority(
    reportId: string,
    priority: ReportPriority,
    actor: AuthenticatedUser,
    context: ReportRequestContext,
  ): Promise<ModerationReport> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Report);
      const report = await repository.findOne({
        where: { id: reportId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!report) throw new NotFoundException('Denúncia não encontrada.');
      const previous = report.priority;
      report.priority = priority;
      await repository.save(report);
      if (previous !== priority) {
        await this.auditService.record(
          {
            actorUserId: actor.id,
            targetUserId: report.targetUserId,
            action: 'report.priority_changed',
            context: { reportId, from: previous, to: priority },
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          manager,
        );
      }
    });
    return this.getForModeration(reportId);
  }

  async decide(
    reportId: string,
    action: ReportDecisionAction,
    reason: string,
    actor: AuthenticatedUser,
    context: ReportRequestContext,
  ): Promise<ModerationReport> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Report);
      const report = await repository.findOne({
        where: { id: reportId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!report) throw new NotFoundException('Denúncia não encontrada.');
      const isRestore =
        action === 'restore_job' && report.status === 'resolved';
      if (
        (report.status === 'resolved' || report.status === 'dismissed') &&
        !isRestore
      ) {
        throw new ConflictException('Esta denúncia já possui decisão final.');
      }

      const fromStatus = report.status;
      let toStatus: ReportStatus;
      if (action === 'start_review') {
        if (report.status !== 'open') {
          throw new ConflictException('A denúncia já está em análise.');
        }
        toStatus = 'in_review';
      } else if (action === 'dismiss' || action === 'restore_job') {
        toStatus = 'dismissed';
      } else {
        toStatus = 'resolved';
      }

      if (action === 'hide_job' || action === 'restore_job') {
        await this.applyJobDecision(manager, report, action, actor.id);
      }

      report.status = toStatus;
      report.reviewedAt =
        toStatus === 'in_review' ? report.reviewedAt : new Date();
      await repository.save(report);
      await manager.getRepository(ModerationDecision).save({
        reportId,
        actorUserId: actor.id,
        action,
        reason: reason.trim(),
        fromStatus,
        toStatus,
      });
      await this.auditService.record(
        {
          actorUserId: actor.id,
          targetUserId: report.targetUserId,
          action: 'report.decision_recorded',
          context: {
            reportId,
            targetType: report.targetType,
            targetId: report.targetId,
            decision: action,
            fromStatus,
            toStatus,
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        manager,
      );
    });
    return this.getForModeration(reportId);
  }

  private async applyJobDecision(
    manager: EntityManager,
    report: Report,
    action: 'hide_job' | 'restore_job',
    actorUserId: string,
  ): Promise<void> {
    if (report.targetType !== 'job') {
      throw new BadRequestException(
        'Esta decisão só pode ser aplicada a uma vaga denunciada.',
      );
    }
    const repository = manager.getRepository(Job);
    const job = await repository.findOne({
      where: { id: report.targetId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!job) throw new NotFoundException('Vaga denunciada não encontrada.');

    if (action === 'hide_job') {
      if (!['approved', 'paused'].includes(job.status)) {
        throw new ConflictException(
          'A vaga não está publicável no estado atual.',
        );
      }
      const previous = job.status;
      job.status = 'reported';
      job.publishedAt = null;
      await repository.save(job);
      await this.auditService.record(
        {
          actorUserId,
          targetUserId: job.ownerUserId,
          action: 'job.reported',
          context: { jobId: job.id, reportId: report.id, fromStatus: previous },
        },
        manager,
      );
      return;
    }

    if (job.status !== 'reported') {
      throw new ConflictException('A vaga não está suspensa por denúncia.');
    }
    job.status = 'approved';
    job.publishedAt = new Date();
    await repository.save(job);
    await this.auditService.record(
      {
        actorUserId,
        targetUserId: job.ownerUserId,
        action: 'job.restored',
        context: { jobId: job.id, reportId: report.id },
      },
      manager,
    );
  }

  private async resolveTargetUser(
    targetType: ReportTargetType,
    targetId: string,
    reporter: AuthenticatedUser,
  ): Promise<string> {
    if (targetType === 'job') {
      const job = await this.jobRepository.findOneBy({ id: targetId });
      if (
        !job ||
        (!['approved', 'paused', 'reported'].includes(job.status) &&
          job.ownerUserId !== reporter.id &&
          reporter.role !== 'admin' &&
          reporter.role !== 'coordinator')
      ) {
        throw new NotFoundException('Recurso denunciado não encontrado.');
      }
      return job.ownerUserId;
    }

    if (targetType === 'profile') {
      const candidate = await this.candidateRepository.findOneBy({
        id: targetId,
      });
      if (candidate) {
        const canReference =
          candidate.userId === reporter.id ||
          reporter.role === 'admin' ||
          reporter.role === 'coordinator' ||
          (reporter.role === 'employer' &&
            candidate.isActive &&
            candidate.visibility !== 'private');
        if (!canReference) {
          throw new NotFoundException('Recurso denunciado não encontrado.');
        }
        return candidate.userId;
      }
      const employer = await this.employerRepository.findOneBy({
        id: targetId,
      });
      if (
        !employer ||
        (employer.userId !== reporter.id &&
          reporter.role !== 'admin' &&
          reporter.role !== 'coordinator')
      ) {
        throw new NotFoundException('Recurso denunciado não encontrado.');
      }
      return employer.userId;
    }

    if (targetType === 'user') {
      const user = await this.userRepository.findOneBy({ id: targetId });
      if (!user) {
        throw new NotFoundException('Recurso denunciado não encontrado.');
      }
      return user.id;
    }

    const application = await this.applicationRepository.findOne({
      where: { id: targetId },
      relations: { candidateProfile: true, job: true },
    });
    if (!application) {
      throw new NotFoundException('Recurso denunciado não encontrado.');
    }
    const isCandidate = application.candidateProfile.userId === reporter.id;
    const isEmployer = application.job.ownerUserId === reporter.id;
    const isTeam = reporter.role === 'admin' || reporter.role === 'coordinator';
    if (!isCandidate && !isEmployer && !isTeam) {
      throw new NotFoundException('Recurso denunciado não encontrado.');
    }
    return isCandidate
      ? application.job.ownerUserId
      : application.candidateProfile.userId;
  }

  private initialPriority(reason: ReportReason): ReportPriority {
    if (['discrimination', 'harassment', 'privacy', 'fraud'].includes(reason)) {
      return 'high';
    }
    if (reason === 'spam') return 'low';
    return 'normal';
  }

  private toMyReport(report: Report): MyReport {
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  private toModerationReport(report: Report): ModerationReport {
    return {
      ...this.toMyReport(report),
      description: report.description,
      priority: report.priority,
      targetUserId: report.targetUserId,
      reporter: {
        id: report.reporter.id,
        displayName: report.reporter.displayName,
      },
      decisions: [...(report.decisions ?? [])]
        .sort(
          (left, right) =>
            left.createdAt.getTime() - right.createdAt.getTime() ||
            left.id.localeCompare(right.id),
        )
        .map((decision) => ({
          id: decision.id,
          action: decision.action,
          reason: decision.reason,
          actorUserId: decision.actorUserId,
          fromStatus: decision.fromStatus,
          toStatus: decision.toStatus,
          createdAt: decision.createdAt.toISOString(),
        })),
    };
  }

  private page<T>(
    items: T[],
    total: number,
    query: { page: number; limit: number },
  ) {
    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }
}
