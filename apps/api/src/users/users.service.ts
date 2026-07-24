import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { UserRole, UserStatus } from '@vale/shared';
import * as argon2 from 'argon2';
import { DataSource, IsNull, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { RefreshToken } from '../auth/refresh-token.entity';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './user.entity';

export type CreatePublicUserInput = {
  displayName: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'candidate' | 'employer'>;
};

export type AdministrativeChange = {
  actorUserId: string;
  reason: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async createPublicUser(input: CreatePublicUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });

    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const user = this.userRepository.create({
      displayName: input.displayName.trim().replace(/\s+/g, ' '),
      email,
      passwordHash: await argon2.hash(input.password),
      role: input.role,
      status: 'pending_email',
      emailVerifiedAt: null,
      lastLoginAt: null,
    });

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered.');
      }

      throw error;
    }
  }

  async createSeedAdmin(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return existing;
    }

    const now = new Date();
    const admin = this.userRepository.create({
      displayName: 'Administrador',
      email: normalizedEmail,
      passwordHash: await argon2.hash(password),
      role: 'admin',
      status: 'active',
      emailVerifiedAt: now,
      lastLoginAt: null,
    });

    return this.userRepository.save(admin);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findActiveAuthUser(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      authVersion: user.authVersion,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      initialPath: this.getInitialPath(user),
    };
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async markEmailVerified(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.emailVerifiedAt ??= new Date();

    if (user.status === 'pending_email') {
      user.status = 'active';
    }

    return this.userRepository.save(user);
  }

  async updateRole(
    userId: string,
    role: UserRole,
    change: AdministrativeChange,
  ): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const user = await repository.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      const previousRole = user.role;
      user.role = role;
      const updated = await repository.save(user);

      if (previousRole !== role) {
        await repository.increment({ id: user.id }, 'authVersion', 1);
        await this.auditService.record(
          {
            actorUserId: change.actorUserId,
            targetUserId: user.id,
            action: 'user.role_changed',
            context: {
              from: previousRole,
              to: role,
              reason: change.reason,
            },
            ipAddress: change.ipAddress,
            userAgent: change.userAgent,
          },
          manager,
        );
      }

      return this.toResponse(updated);
    });
  }

  async updateStatus(
    userId: string,
    status: Exclude<UserStatus, 'pending_email'>,
    change: AdministrativeChange,
  ): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const user = await repository.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      if (!this.canTransition(user.status, status, user.emailVerifiedAt)) {
        throw new BadRequestException(
          `Account cannot transition from ${user.status} to ${status}.`,
        );
      }

      const previousStatus = user.status;
      user.status = status;
      const updated = await repository.save(user);

      if (previousStatus !== status) {
        if (status === 'suspended' || status === 'disabled') {
          await repository.increment({ id: user.id }, 'authVersion', 1);
          await manager.getRepository(RefreshToken).update(
            { userId: user.id, revokedAt: IsNull() },
            {
              revokedAt: new Date(),
              revokedByIp: change.ipAddress ?? null,
            },
          );
        }

        const action =
          status === 'suspended'
            ? 'user.suspended'
            : status === 'disabled'
              ? 'user.disabled'
              : 'user.reactivated';
        await this.auditService.record(
          {
            actorUserId: change.actorUserId,
            targetUserId: user.id,
            action,
            context: {
              from: previousStatus,
              to: status,
              reason: change.reason,
            },
            ipAddress: change.ipAddress,
            userAgent: change.userAgent,
          },
          manager,
        );
      }

      return this.toResponse(updated);
    });
  }

  toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      initialPath: this.getInitialPath(user),
    };
  }

  private canTransition(
    from: UserStatus,
    to: Exclude<UserStatus, 'pending_email'>,
    emailVerifiedAt: Date | null,
  ): boolean {
    if (from === to) {
      return true;
    }

    if (to === 'active' && !emailVerifiedAt) {
      return false;
    }

    const transitions: Record<UserStatus, UserStatus[]> = {
      pending_email: ['suspended', 'disabled'],
      active: ['suspended', 'disabled'],
      suspended: ['active', 'disabled'],
      disabled: ['active', 'suspended'],
    };

    return transitions[from].includes(to);
  }

  private getInitialPath(user: User): string {
    if (user.status === 'suspended' || user.status === 'disabled') {
      return '/conta-indisponivel';
    }

    if (user.status === 'pending_email') {
      return user.role === 'employer'
        ? '/onboarding/contratante'
        : '/onboarding/candidato';
    }

    const paths: Record<UserRole, string> = {
      admin: '/admin',
      coordinator: '/app/equipe',
      employer: '/app/contratante',
      candidate: '/app/candidato',
    };

    return paths[user.role];
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
