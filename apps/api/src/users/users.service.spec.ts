import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { DataSource, getMetadataArgsStorage } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const queryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const repository = {
    create: jest.fn((input: Partial<User>) => input),
    createQueryBuilder: jest.fn(() => queryBuilder),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { record: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('creates a public candidate with pending email status', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.save.mockImplementation(async (user: User) => ({
      ...user,
      id: 'user-1',
    }));

    const user = await service.createPublicUser({
      displayName: ' Pessoa Candidata ',
      email: ' Candidate@Example.com ',
      password: 'strong-password',
      role: 'candidate',
    });

    expect(user.email).toBe('candidate@example.com');
    expect(user.displayName).toBe('Pessoa Candidata');
    expect(user.role).toBe('candidate');
    expect(user.status).toBe('pending_email');
    await expect(
      argon2.verify(user.passwordHash, 'strong-password'),
    ).resolves.toBe(true);
  });

  it('rejects duplicated email during registration', async () => {
    repository.findOne.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.createPublicUser({
        displayName: 'Pessoa Candidata',
        email: 'candidate@example.com',
        password: 'strong-password',
        role: 'candidate',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('excludes the password hash by default and selects it only for login', async () => {
    const passwordColumn = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === User && column.propertyName === 'passwordHash',
    );
    expect(passwordColumn?.options.select).toBe(false);

    queryBuilder.getOne.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
    });
    const user = await service.findByEmailWithPassword(
      ' Candidate@Example.com ',
    );

    expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
      email: 'candidate@example.com',
    });
    expect(user).toMatchObject({ passwordHash: 'hash' });
    expect(
      service.toResponse({ ...user, ...responseUser() } as User),
    ).not.toHaveProperty('passwordHash');
  });

  it.each(['suspended', 'disabled'] as const)(
    'email verification does not reactivate a %s account',
    async (status) => {
      repository.findOne.mockResolvedValue({
        id: 'user-1',
        displayName: 'Pessoa Candidata',
        email: 'candidate@example.com',
        status,
        emailVerifiedAt: null,
      });
      repository.save.mockImplementation(async (user: User) => user);

      const user = await service.markEmailVerified('user-1');

      expect(user.emailVerifiedAt).toBeInstanceOf(Date);
      expect(user.status).toBe(status);
    },
  );
});

function responseUser(): Partial<User> {
  return {
    id: '9d468807-fd6d-4be7-b16d-c067f17c0501',
    displayName: 'Pessoa Candidata',
    email: 'candidate@example.com',
    role: 'candidate',
    status: 'active',
    emailVerifiedAt: new Date(),
  };
}
