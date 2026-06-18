import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { UserRole } from '@vale/shared';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';

import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './user.entity';

export type CreatePublicUserInput = {
  email: string;
  password: string;
  role: Extract<UserRole, 'candidate' | 'employer'>;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createPublicUser(input: CreatePublicUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });

    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const user = this.userRepository.create({
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
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
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

    user.emailVerifiedAt = new Date();
    user.status = 'active';

    return this.userRepository.save(user);
  }

  async updateRole(userId: string, role: UserRole): Promise<UserResponseDto> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.role = role;
    const updated = await this.userRepository.save(user);

    return this.toResponse(updated);
  }

  toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    };
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
