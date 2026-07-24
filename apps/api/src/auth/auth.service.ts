import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';

import { JwtPayload } from '../common/auth/authenticated-user';
import { Env } from '../common/config/env.validation';
import { EmailService } from '../email/email.service';
import { TermsService } from '../terms/terms.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationToken } from './email-verification-token.entity';
import { PasswordResetToken } from './password-reset-token.entity';
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

export type SessionResult = AuthResponseDto &
  AuthTokens & {
    user: UserResponseDto;
  };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly termsService: TermsService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async register(
    input: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<SessionResult> {
    const currentDocuments = this.getCurrentLegalDocuments();

    if (
      input.acceptedTermsVersion !== currentDocuments.terms ||
      input.acceptedPrivacyVersion !== currentDocuments.privacy ||
      input.acceptedGuidelinesVersion !== currentDocuments.guidelines
    ) {
      throw new BadRequestException(
        'Current terms, privacy policy and guidelines must be accepted.',
      );
    }

    const user = await this.usersService.createPublicUser({
      displayName: input.displayName,
      email: input.email,
      password: input.password,
      role: input.role,
    });

    await this.termsService.acceptAll(user.id, currentDocuments, metadata);

    const emailVerificationToken = await this.createEmailVerificationToken(
      user.id,
    );
    try {
      await this.emailService.sendEmailVerification({
        displayName: user.displayName,
        email: user.email,
        role: input.role,
        token: emailVerificationToken,
      });
    } catch {
      this.logger.error(
        'Initial email verification delivery failed; the user can request a resend.',
      );
    }
    const tokens = await this.issueTokens(user, metadata.ipAddress);

    return {
      ...tokens,
      user: this.usersService.toResponse(user),
    };
  }

  async login(
    input: LoginDto,
    metadata: RequestMetadata,
  ): Promise<SessionResult> {
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
  ): Promise<SessionResult> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const outcome = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);
      const existing = await repository.findOne({
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      if (!existing) {
        return { kind: 'invalid' } as const;
      }

      if (existing.revokedAt) {
        await this.revokeTokenFamily(
          manager,
          existing.familyId,
          metadata.ipAddress,
        );
        return { kind: 'reused' } as const;
      }

      if (existing.expiresAt <= new Date()) {
        existing.revokedAt = new Date();
        existing.revokedByIp = metadata.ipAddress ?? null;
        await repository.save(existing);
        return { kind: 'invalid' } as const;
      }

      const user = await manager.getRepository(User).findOneBy({
        id: existing.userId,
      });

      if (!user) {
        return { kind: 'invalid' } as const;
      }

      if (user.status === 'suspended' || user.status === 'disabled') {
        await this.revokeTokenFamily(
          manager,
          existing.familyId,
          metadata.ipAddress,
        );
        return { kind: 'blocked' } as const;
      }

      const tokens = await this.issueTokens(
        user,
        metadata.ipAddress,
        manager,
        existing.familyId,
      );
      const successor = await repository.findOneByOrFail({
        tokenHash: this.hashToken(tokens.refreshToken),
      });
      existing.revokedAt = new Date();
      existing.revokedByIp = metadata.ipAddress ?? null;
      existing.replacedByTokenId = successor.id;
      await repository.save(existing);

      return {
        kind: 'success',
        result: {
          ...tokens,
          user: this.usersService.toResponse(user),
        },
      } as const;
    });

    if (outcome.kind === 'reused') {
      throw new UnauthorizedException(
        'Refresh token reuse detected; session family was revoked.',
      );
    }

    if (outcome.kind === 'blocked') {
      throw new UnauthorizedException('User account cannot refresh tokens.');
    }

    if (outcome.kind === 'invalid') {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    return outcome.result;
  }

  async logout(
    rawRefreshToken: string | undefined,
    ipAddress?: string | null,
  ): Promise<void> {
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

  async requestEmailVerification(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);

    if (!user || user.emailVerifiedAt) {
      return { message: 'If verification is needed, an email was sent.' };
    }

    if (user.role !== 'candidate' && user.role !== 'employer') {
      return { message: 'If verification is needed, an email was sent.' };
    }

    const token = await this.createEmailVerificationToken(user.id);
    await this.emailService.sendEmailVerification({
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      token,
    });

    return { message: 'If verification is needed, an email was sent.' };
  }

  async verifyEmail(rawToken: string): Promise<UserResponseDto> {
    const user = await this.dataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(EmailVerificationToken);
      const token = await tokenRepository.findOne({
        where: { tokenHash: this.hashToken(rawToken) },
        lock: { mode: 'pessimistic_write' },
      });

      if (!token || token.consumedAt || token.expiresAt <= new Date()) {
        throw new BadRequestException(
          'Email verification token is invalid or expired.',
        );
      }

      const userRepository = manager.getRepository(User);
      const target = await userRepository.findOne({
        where: { id: token.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!target) {
        throw new BadRequestException('Email verification token is invalid.');
      }

      token.consumedAt = new Date();
      await tokenRepository.save(token);
      target.emailVerifiedAt ??= new Date();

      if (target.status === 'pending_email') {
        target.status = 'active';
      }

      return userRepository.save(target);
    });
    return this.usersService.toResponse(user);
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = {
      message:
        'If an account exists for this email, password reset instructions were sent.',
    };
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return response;
    }

    const token = await this.createPasswordResetToken(user.id);
    try {
      await this.emailService.sendPasswordReset({
        displayName: user.displayName,
        email: user.email,
        token,
      });
    } catch {
      this.logger.error('Password reset email delivery failed.');
    }

    return response;
  }

  async resetPassword(
    rawToken: string,
    password: string,
    metadata: RequestMetadata,
  ): Promise<{ message: string }> {
    const passwordHash = await argon2.hash(password);
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(PasswordResetToken);
      const token = await repository.findOne({
        where: { tokenHash: this.hashToken(rawToken) },
        lock: { mode: 'pessimistic_write' },
      });

      if (!token || token.consumedAt || token.expiresAt <= new Date()) {
        throw new BadRequestException(
          'Password reset token is invalid or expired.',
        );
      }

      token.consumedAt = new Date();
      await repository.save(token);
      await manager.getRepository(User).update(token.userId, { passwordHash });
      await manager
        .getRepository(User)
        .increment({ id: token.userId }, 'authVersion', 1);
      await manager.getRepository(RefreshToken).update(
        { userId: token.userId, revokedAt: IsNull() },
        {
          revokedAt: new Date(),
          revokedByIp: metadata.ipAddress ?? null,
        },
      );
    });

    return {
      message:
        'Password updated. Existing sessions were revoked; sign in again.',
    };
  }

  private async issueTokens(
    user: User,
    ipAddress?: string | null,
    manager?: EntityManager,
    familyId: string = randomUUID(),
  ): Promise<AuthTokens> {
    const access = await this.issueAccessToken(user);
    const refreshToken = this.generateOpaqueToken();
    const expiresAt = new Date(
      Date.now() +
        this.configService.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) *
          24 *
          60 *
          60 *
          1000,
    );
    const repository = manager
      ? manager.getRepository(RefreshToken)
      : this.refreshTokenRepository;

    await repository.save(
      repository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        familyId,
        expiresAt,
        revokedAt: null,
        replacedByTokenId: null,
        createdByIp: ipAddress ?? null,
        revokedByIp: null,
      }),
    );

    return { ...access, refreshToken };
  }

  private async issueAccessToken(
    user: User,
  ): Promise<{ accessToken: string; expiresInSeconds: number }> {
    const expiresInSeconds = this.configService.get('JWT_ACCESS_TTL_SECONDS', {
      infer: true,
    });
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      authVersion: user.authVersion,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiresInSeconds,
    });

    return { accessToken, expiresInSeconds };
  }

  private async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateOpaqueToken();
    const ttlHours = this.configService.get('EMAIL_VERIFICATION_TTL_HOURS', {
      infer: true,
    });

    await this.emailTokenRepository.update(
      { userId, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
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

  private async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateOpaqueToken();
    const ttlMinutes = this.configService.get('PASSWORD_RESET_TTL_MINUTES', {
      infer: true,
    });

    await this.passwordResetTokenRepository.update(
      { userId, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
        consumedAt: null,
      }),
    );

    return token;
  }

  private async revokeTokenFamily(
    manager: EntityManager,
    familyId: string,
    ipAddress?: string | null,
  ): Promise<void> {
    await manager.getRepository(RefreshToken).update(
      { familyId, revokedAt: IsNull() },
      {
        revokedAt: new Date(),
        revokedByIp: ipAddress ?? null,
      },
    );
  }

  private getCurrentLegalDocuments() {
    return {
      terms: this.configService.get('LEGAL_TERMS_VERSION', { infer: true }),
      privacy: this.configService.get('LEGAL_PRIVACY_VERSION', { infer: true }),
      guidelines: this.configService.get('LEGAL_GUIDELINES_VERSION', {
        infer: true,
      }),
    };
  }

  private generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
