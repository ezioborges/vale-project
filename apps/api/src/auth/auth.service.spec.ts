import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { TermsService } from '../terms/terms.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { EmailVerificationToken } from './email-verification-token.entity';
import { RefreshToken } from './refresh-token.entity';

class MemoryRepository<T extends { id?: string }> {
  items: T[] = [];

  create(input: Partial<T>): T {
    return input as T;
  }

  async save(input: T): Promise<T> {
    if (!input.id) {
      input.id = `id-${this.items.length + 1}`;
      this.items.push(input);
      return input;
    }

    const index = this.items.findIndex((item) => item.id === input.id);
    if (index >= 0) {
      this.items[index] = input;
      return input;
    }

    this.items.push(input);
    return input;
  }

  async findOne(options: {
    where: Partial<T>;
  }): Promise<(T & { user?: User }) | null> {
    return this.findOneBy(options.where);
  }

  async findOneBy(where: Partial<T>): Promise<(T & { user?: User }) | null> {
    const item = this.items.find((candidate) =>
      Object.entries(where).every(([key, value]) => {
        if (value && typeof value === 'object' && '@instanceof' in value) {
          return candidate[key as keyof T] === null;
        }

        return candidate[key as keyof T] === value;
      }),
    );

    if (!item) {
      return null;
    }

    if ('userId' in item) {
      return { ...item, user: testUser } as T & { user: User };
    }

    return item;
  }
}

const testUser = {
  id: 'user-1',
  email: 'candidate@example.com',
  role: 'candidate',
  status: 'pending_email',
  emailVerifiedAt: null,
  lastLoginAt: null,
} as User;

describe('AuthService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string | number> = {
        EMAIL_VERIFICATION_TTL_HOURS: 24,
        JWT_ACCESS_TTL_SECONDS: 900,
        NODE_ENV: 'test',
        REFRESH_TOKEN_TTL_DAYS: 30,
        TERMS_CURRENT_VERSION: 'mvp-2026-06-13',
      };

      return values[key];
    }),
  };
  const jwtService = {
    signAsync: jest.fn(async () => 'access-token'),
  } as unknown as JwtService;
  const usersService = {
    createPublicUser: jest.fn(async () => testUser),
    findByEmail: jest.fn(),
    markEmailVerified: jest.fn(async () => ({
      ...testUser,
      status: 'active',
      emailVerifiedAt: new Date('2026-06-13T00:00:00.000Z'),
    })),
    toResponse: jest.fn((user: User) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    })),
    updateLastLogin: jest.fn(),
  } as unknown as UsersService;
  const termsService = {
    accept: jest.fn(),
  } as unknown as TermsService;

  let refreshRepository: MemoryRepository<RefreshToken>;
  let emailRepository: MemoryRepository<EmailVerificationToken>;
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    refreshRepository = new MemoryRepository<RefreshToken>();
    emailRepository = new MemoryRepository<EmailVerificationToken>();
    service = new AuthService(
      configService as never,
      jwtService,
      usersService,
      termsService,
      refreshRepository as never,
      emailRepository as never,
    );
  });

  it('registers only after the current terms version is accepted', async () => {
    await expect(
      service.register(
        {
          email: 'candidate@example.com',
          password: 'strong-password',
          role: 'candidate',
          acceptTerms: true,
          acceptedTermsVersion: 'old-version',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const response = await service.register(
      {
        email: 'candidate@example.com',
        password: 'strong-password',
        role: 'candidate',
        acceptTerms: true,
        acceptedTermsVersion: 'mvp-2026-06-13',
      },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(usersService.createPublicUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'candidate' }),
    );
    expect(termsService.accept).toHaveBeenCalledWith(
      expect.objectContaining({ version: 'mvp-2026-06-13' }),
    );
    expect(response.devEmailVerificationToken).toBeDefined();
    expect(refreshRepository.items).toHaveLength(1);
  });

  it('rejects invalid login and accepts valid password', async () => {
    const passwordHash = await argon2.hash('correct-password');
    jest.mocked(usersService.findByEmail).mockResolvedValue({
      ...testUser,
      passwordHash,
    } as User);

    await expect(
      service.login(
        { email: 'candidate@example.com', password: 'wrong-password' },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const response = await service.login(
      { email: 'candidate@example.com', password: 'correct-password' },
      {},
    );

    expect(response.accessToken).toBe('access-token');
    expect(refreshRepository.items).toHaveLength(1);
  });

  it('rotates refresh tokens and revokes logout token', async () => {
    const login = await service.register(
      {
        email: 'candidate@example.com',
        password: 'strong-password',
        role: 'candidate',
        acceptTerms: true,
        acceptedTermsVersion: 'mvp-2026-06-13',
      },
      {},
    );

    const refreshed = await service.refresh(login.refreshToken, {
      ipAddress: '127.0.0.1',
    });

    expect(refreshed.refreshToken).not.toBe(login.refreshToken);
    expect(refreshRepository.items[0]?.revokedAt).toBeInstanceOf(Date);

    await service.logout(refreshed.refreshToken, '127.0.0.1');
    expect(refreshRepository.items[1]?.revokedAt).toBeInstanceOf(Date);
  });

  it('verifies email tokens once', async () => {
    const response = await service.register(
      {
        email: 'candidate@example.com',
        password: 'strong-password',
        role: 'candidate',
        acceptTerms: true,
        acceptedTermsVersion: 'mvp-2026-06-13',
      },
      {},
    );

    const user = await service.verifyEmail(response.devEmailVerificationToken!);

    expect(user.status).toBe('active');
    await expect(
      service.verifyEmail(response.devEmailVerificationToken!),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
