import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { LegalDocumentType } from '@vale/shared';
import { Repository } from 'typeorm';

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

  async accept(input: AcceptTermsInput): Promise<TermAcceptance> {
    const existing = await this.termAcceptanceRepository.findOneBy({
      userId: input.userId,
      documentType: input.documentType,
      version: input.version,
    });

    if (existing) {
      return existing;
    }

    const acceptance = this.termAcceptanceRepository.create({
      userId: input.userId,
      documentType: input.documentType,
      version: input.version,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return this.termAcceptanceRepository.save(acceptance);
  }

  async acceptAll(
    userId: string,
    versions: Record<LegalDocumentType, string>,
    metadata: Pick<AcceptTermsInput, 'ipAddress' | 'userAgent'>,
  ): Promise<void> {
    await Promise.all(
      Object.entries(versions).map(([documentType, version]) =>
        this.accept({
          userId,
          documentType: documentType as LegalDocumentType,
          version,
          ...metadata,
        }),
      ),
    );
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
