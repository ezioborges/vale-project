import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { Env } from '../config/env.validation';
import { TermsService } from '../../terms/terms.service';
import { REQUIRE_TERMS_KEY } from './auth.constants';
import { AuthenticatedUser } from './authenticated-user';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class TermsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService<Env, true>,
    private readonly termsService: TermsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresTerms = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TERMS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresTerms) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Accepted terms are required.');
    }

    const version = this.configService.get('TERMS_CURRENT_VERSION', {
      infer: true,
    });
    const hasAccepted = await this.termsService.hasAcceptedVersion(
      userId,
      version,
    );

    if (!hasAccepted) {
      throw new ForbiddenException('Current terms must be accepted.');
    }

    return true;
  }
}
