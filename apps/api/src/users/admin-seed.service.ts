import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '../common/config/env.validation';
import { UsersService } from './users.service';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly usersService: UsersService,
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

    await this.usersService.createSeedAdmin(email, password);
    this.logger.log(`Seed admin available for ${email}.`);
  }
}
