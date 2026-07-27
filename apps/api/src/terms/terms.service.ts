import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { LegalDocumentType } from '@vale/shared';
import { EntityManager, Repository } from 'typeorm';

import { TermAcceptance } from './term-acceptance.entity';

export type AcceptTermsInput = {
  userId: string;
  documentType: LegalDocumentType;
  version: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class TermsService {
  constructor(
    @InjectRepository(TermAcceptance)
    private readonly termAcceptanceRepository: Repository<TermAcceptance>,
  ) {}

  async accept(
    input: AcceptTermsInput,
    manager?: EntityManager,
  ): Promise<TermAcceptance> {
    const repository = manager
      ? manager.getRepository(TermAcceptance)
      : this.termAcceptanceRepository;
    const existing = await repository.findOneBy({
      userId: input.userId,
      documentType: input.documentType,
      version: input.version,
    });

    if (existing) {
      return existing;
    }

    const acceptance = repository.create({
      userId: input.userId,
      documentType: input.documentType,
      version: input.version,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return repository.save(acceptance);
  }

  async acceptAll(
    userId: string,
    versions: Record<LegalDocumentType, string>,
    metadata: Pick<AcceptTermsInput, 'ipAddress' | 'userAgent'>,
    manager?: EntityManager,
  ): Promise<void> {
    for (const [documentType, version] of Object.entries(versions)) {
      await this.accept(
        {
          userId,
          documentType: documentType as LegalDocumentType,
          version,
          ...metadata,
        },
        manager,
      );
    }
  }

  async hasAcceptedCurrentDocuments(
    userId: string,
    versions: Record<LegalDocumentType, string>,
  ): Promise<boolean> {
    const accepted = await this.termAcceptanceRepository.countBy(
      Object.entries(versions).map(([documentType, version]) => ({
        userId,
        documentType: documentType as LegalDocumentType,
        version,
      })),
    );

    return accepted === Object.keys(versions).length;
  }
}
