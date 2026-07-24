import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { EmailService } from '../email/email.service';
import { TermsService } from '../terms/terms.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const testUser = {
  id: '9d468807-fd6d-4be7-b16d-c067f17c0501',
  displayName: 'Pessoa Candidata',
  email: 'candidate@example.com',
  passwordHash: '',
  role: 'candidate',
  status: 'pending_email',
  emailVerifiedAt: null,
  lastLoginAt: null,
} as User;

const validRegistration = {
  displayName: 'Pessoa Candidata',
  email: 'candidate@example.com',
  password: 'strong-password',
  role: 'candidate' as const,
  acceptedTermsVersion: 'terms-current',
  acceptedPrivacyVersion: 'privacy-current',
  acceptedGuidelinesVersion: 'guidelines-current',
  acceptTerms: true as const,
  acceptPrivacy: true as const,
  acceptGuidelines: true as const,
};

describe('AuthService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string | number> = {
        EMAIL_VERIFICATION_TTL_HOURS: 24,
        JWT_ACCESS_TTL_SECONDS: 900,
        LEGAL_GUIDELINES_VERSION: 'guidelines-current',
        LEGAL_PRIVACY_VERSION: 'privacy-current',
        LEGAL_TERMS_VERSION: 'terms-current',
        PASSWORD_RESET_TTL_MINUTES: 15,
        REFRESH_TOKEN_TTL_DAYS: 30,
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
    findById: jest.fn(),
    toResponse: jest.fn((user: User) => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      initialPath: '/onboarding/candidato',
    })),
    updateLastLogin: jest.fn(),
  } as unknown as UsersService;
  const termsService = {
    acceptAll: jest.fn(),
  } as unknown as TermsService;
  const emailService = {
    sendEmailVerification: jest.fn(),
    sendPasswordReset: jest.fn(),
  } as unknown as EmailService;

  const createRepository = () => ({
    create: jest.fn((input: object) => input),
    save: jest.fn(async (input: object) => ({ id: 'token-id', ...input })),
    update: jest.fn(),
    findOneBy: jest.fn(),
  });

  let refreshRepository: ReturnType<typeof createRepository>;
  let emailRepository: ReturnType<typeof createRepository>;
  let passwordRepository: ReturnType<typeof createRepository>;
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    refreshRepository = createRepository();
    emailRepository = createRepository();
    passwordRepository = createRepository();
    service = new AuthService(
      configService as never,
      jwtService,
      usersService,
      termsService,
      emailService,
      {} as never,
      refreshRepository as never,
      emailRepository as never,
      passwordRepository as never,
    );
  });

  it('requires and records the three current legal documents', async () => {
    await expect(
      service.register(
        { ...validRegistration, acceptedPrivacyVersion: 'outdated' },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const response = await service.register(validRegistration, {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(usersService.createPublicUser).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Pessoa Candidata',
        role: 'candidate',
      }),
    );
    expect(termsService.acceptAll).toHaveBeenCalledWith(
      testUser.id,
      {
        terms: 'terms-current',
        privacy: 'privacy-current',
        guidelines: 'guidelines-current',
      },
      expect.objectContaining({ userAgent: 'jest' }),
    );
    expect(emailService.sendEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({ email: testUser.email }),
    );
    expect(response).not.toHaveProperty('devEmailVerificationToken');
    expect(refreshRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid login and accepts a valid password', async () => {
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
    expect(refreshRepository.save).toHaveBeenCalledTimes(1);
  });

  it('does not reveal whether a password-reset account exists', async () => {
    jest.mocked(usersService.findByEmail).mockResolvedValueOnce(null);
    const absent = await service.requestPasswordReset('absent@example.com');

    jest.mocked(usersService.findByEmail).mockResolvedValueOnce(testUser);
    const present = await service.requestPasswordReset(testUser.email);

    expect(absent).toEqual(present);
    expect(emailService.sendPasswordReset).toHaveBeenCalledTimes(1);
  });
});
