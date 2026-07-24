import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { UsersService } from '../../users/users.service';
import { ACCESS_TOKEN_COOKIE, IS_PUBLIC_KEY } from './auth.constants';
import { AuthenticatedUser, JwtPayload } from './authenticated-user';

type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired.');
    }

    const user = await this.usersService.findActiveAuthUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (user.status === 'suspended' || user.status === 'disabled') {
      throw new ForbiddenException('User account cannot access this resource.');
    }

    if (payload.authVersion !== user.authVersion) {
      throw new UnauthorizedException('Access token has been revoked.');
    }

    request.user = user;
    return true;
  }

  private extractToken(request: RequestWithCookies): string | undefined {
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token;
    }

    return request.cookies?.[ACCESS_TOKEN_COOKIE];
  }
}
