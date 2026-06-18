import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import { IsNull, Repository } from 'typeorm';

import { JwtPayload } from '../common/auth/authenticated-user';
import { Env } from '../common/config/env.validation';
import { TermsService } from '../terms/terms.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationToken } from './email-verification-token.entity';
import { RefreshToken } from './refresh-token.entity';

export type RequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly termsService: TermsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailTokenRepository: Repository<EmailVerificationToken>,
  ) {}

  async register(
    input: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const currentTerms = this.configService.get('TERMS_CURRENT_VERSION', {
      infer: true,
    });

    if (input.acceptedTermsVersion !== currentTerms) {
      throw new BadRequestException('Current terms version must be accepted.');
    }

    const user = await this.usersService.createPublicUser({
      email: input.email,
      password: input.password,
      role: input.role,
    });

    await this.termsService.accept({
      userId: user.id,
      version: input.acceptedTermsVersion,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    const devEmailVerificationToken = await this.createEmailVerificationToken(
      user.id,
    );
    const tokens = await this.issueTokens(user, metadata.ipAddress);

    return {
      ...tokens,
      user: this.usersService.toResponse(user),
      ...(this.shouldExposeDevTokens() ? { devEmailVerificationToken } : {}),
    };
  }

  async login(
    input: LoginDto,
    metadata: RequestMetadata,
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === 'suspended' || user.status === 'disabled') {
      throw new UnauthorizedException('User account cannot login.');
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user, metadata.ipAddress);

    return {
      ...tokens,
      user: this.usersService.toResponse(user),
    };
  }

  async refresh(
    rawRefreshToken: string,
    metadata: RequestMetadata,
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const existing = await this.refreshTokenRepository.findOne({
      where: {
        tokenHash: this.hashToken(rawRefreshToken),
        revokedAt: IsNull(),
      },
      relations: { user: true },
    });

    if (!existing || existing.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    if (
      existing.user.status === 'suspended' ||
      existing.user.status === 'disabled'
    ) {
      throw new UnauthorizedException('User account cannot refresh tokens.');
    }

    const tokens = await this.issueTokens(existing.user, metadata.ipAddress);
    existing.revokedAt = new Date();
    existing.revokedByIp = metadata.ipAddress ?? null;
    existing.replacedByTokenId = await this.findTokenId(tokens.refreshToken);
    await this.refreshTokenRepository.save(existing);

    return {
      ...tokens,
      user: this.usersService.toResponse(existing.user),
    };
  }

  async logout(rawRefreshToken: string | undefined, ipAddress?: string | null) {
    if (!rawRefreshToken) {
      return;
    }

    const token = await this.refreshTokenRepository.findOneBy({
      tokenHash: this.hashToken(rawRefreshToken),
      revokedAt: IsNull(),
    });

    if (!token) {
      return;
    }

    token.revokedAt = new Date();
    token.revokedByIp = ipAddress ?? null;
    await this.refreshTokenRepository.save(token);
  }

  async requestEmailVerification(userId: string): Promise<{
    devEmailVerificationToken?: string;
  }> {
    const token = await this.createEmailVerificationToken(userId);

    return this.shouldExposeDevTokens()
      ? { devEmailVerificationToken: token }
      : {};
  }

  async verifyEmail(rawToken: string): Promise<UserResponseDto> {
    const token = await this.emailTokenRepository.findOne({
      where: {
        tokenHash: this.hashToken(rawToken),
        consumedAt: IsNull(),
      },
    });

    if (!token || token.expiresAt <= new Date()) {
      throw new BadRequestException('Email verification token is invalid.');
    }

    token.consumedAt = new Date();
    await this.emailTokenRepository.save(token);

    const user = await this.usersService.markEmailVerified(token.userId);
    return this.usersService.toResponse(user);
  }

  private async issueTokens(
    user: User,
    ipAddress?: string | null,
  ): Promise<AuthTokens> {
    const expiresInSeconds = this.configService.get('JWT_ACCESS_TTL_SECONDS', {
      infer: true,
    });
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiresInSeconds,
    });
    const refreshToken = this.generateOpaqueToken();
    const expiresAt = new Date(
      Date.now() +
        this.configService.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) *
          24 *
          60 *
          60 *
          1000,
    );

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        revokedAt: null,
        replacedByTokenId: null,
        createdByIp: ipAddress ?? null,
        revokedByIp: null,
      }),
    );

    return { accessToken, refreshToken, expiresInSeconds };
  }

  private async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateOpaqueToken();
    const ttlHours = this.configService.get('EMAIL_VERIFICATION_TTL_HOURS', {
      infer: true,
    });

    await this.emailTokenRepository.save(
      this.emailTokenRepository.create({
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
        consumedAt: null,
      }),
    );

    return token;
  }

  private async findTokenId(rawRefreshToken: string): Promise<string | null> {
    const token = await this.refreshTokenRepository.findOneBy({
      tokenHash: this.hashToken(rawRefreshToken),
    });

    return token?.id ?? null;
  }

  private generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private shouldExposeDevTokens(): boolean {
    return this.configService.get('NODE_ENV', { infer: true }) !== 'production';
  }
}
