import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FILE_STORAGE, FileStorage } from '../profiles/file-storage';
import { Inject } from '@nestjs/common';
import { ApplicationResumeSnapshot } from './application-resume-snapshot.entity';

@Injectable()
export class ApplicationRetentionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ApplicationRetentionService.name);

  constructor(
    @InjectRepository(ApplicationResumeSnapshot)
    private readonly snapshotRepository: Repository<ApplicationResumeSnapshot>,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const removed = await this.purgeExpired();
    if (removed > 0) {
      this.logger.log(
        `Purged ${removed} expired application resume snapshots.`,
      );
    }
  }

  async purgeExpired(now = new Date()): Promise<number> {
    const expired = await this.snapshotRepository
      .createQueryBuilder('snapshot')
      .innerJoinAndSelect('snapshot.application', 'application')
      .innerJoinAndSelect('application.job', 'job')
      .where('snapshot.retentionUntil <= :now', { now })
      .andWhere(
        `(application.status IN (:...terminalStatuses) OR job.status = :closed)`,
        {
          terminalStatuses: ['rejected', 'cancelled'],
          closed: 'closed',
        },
      )
      .orderBy('snapshot.retentionUntil', 'ASC')
      .take(100)
      .getMany();

    let removed = 0;
    for (const snapshot of expired) {
      try {
        await this.storage.delete(snapshot.storageKey);
        await this.snapshotRepository.delete(snapshot.id);
        removed += 1;
      } catch {
        this.logger.error(
          `Failed to purge application resume snapshot ${snapshot.id}.`,
        );
      }
    }
    return removed;
  }
}
