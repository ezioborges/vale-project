import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TermAcceptance } from './term-acceptance.entity';

export type AcceptTermsInput = {
  userId: string;
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
      version: input.version,
    });

    if (existing) {
      return existing;
    }

    const acceptance = this.termAcceptanceRepository.create({
      userId: input.userId,
      version: input.version,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return this.termAcceptanceRepository.save(acceptance);
  }

  async hasAcceptedVersion(userId: string, version: string): Promise<boolean> {
    return this.termAcceptanceRepository.existsBy({ userId, version });
  }
}
