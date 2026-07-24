import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '../common/config/env.validation';
import { TermsService } from '../terms/terms.service';
import { UsersService } from './users.service';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly usersService: UsersService,
    private readonly termsService: TermsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });

    if (nodeEnv === 'production') {
      return;
    }

    const email = this.configService.get('SEED_ADMIN_EMAIL', { infer: true });
    const password = this.configService.get('SEED_ADMIN_PASSWORD', {
      infer: true,
    });

    if (!email && !password) {
      return;
    }

    if (!email || !password) {
      this.logger.warn(
        'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set together.',
      );
      return;
    }

    const admin = await this.usersService.createSeedAdmin(email, password);
    await this.termsService.acceptAll(
      admin.id,
      {
        terms: this.configService.get('LEGAL_TERMS_VERSION', { infer: true }),
        privacy: this.configService.get('LEGAL_PRIVACY_VERSION', {
          infer: true,
        }),
        guidelines: this.configService.get('LEGAL_GUIDELINES_VERSION', {
          infer: true,
        }),
      },
      { userAgent: 'local-admin-seed' },
    );
    this.logger.log(`Seed admin available for ${email}.`);
  }
}
