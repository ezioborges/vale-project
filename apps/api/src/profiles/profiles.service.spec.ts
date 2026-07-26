import {
  ForbiddenException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CandidateProfile } from './candidate-profile.entity';
import { EmployerProfile } from './employer-profile.entity';
import { FileStorage } from './file-storage';
import { ProfileAsset } from './profile-asset.entity';
import { ProfilesService } from './profiles.service';

describe('ProfilesService privacy boundaries', () => {
  const candidate = authUser('candidate-user', 'candidate');
  const employer = authUser('employer-user', 'employer');
  const profile = candidateProfile();
  const candidateRepository = {
    exist: jest.fn(async () => true),
    findOneBy: jest.fn(async () => profile),
  };
  const employerRepository = {
    findOneBy: jest.fn(async () => ({ isVerified: false })),
  };
  const assetRepository = {
    findBy: jest.fn(async () => []),
  };
  const storage = {
    delete: jest.fn(async () => undefined),
    get: jest.fn(),
    put: jest.fn(),
  };
  const service = new ProfilesService(
    candidateRepository as unknown as Repository<CandidateProfile>,
    employerRepository as unknown as Repository<EmployerProfile>,
    assetRepository as unknown as Repository<ProfileAsset>,
    {} as DataSource,
    {} as AuditService,
    storage as unknown as FileStorage,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    profile.visibility = 'private';
    profile.isActive = true;
    employerRepository.findOneBy.mockResolvedValue({ isVerified: false });
  });

  it('does not let employers cross a private or application-only profile', async () => {
    await expect(
      service.getCandidateForViewer(profile.id, employer),
    ).rejects.toBeInstanceOf(ForbiddenException);

    profile.visibility = 'applications_only';
    await expect(
      service.getCandidateForViewer(profile.id, employer),
    ).rejects.toThrow('only through an application');
  });

  it('requires both consent and employer verification', async () => {
    profile.visibility = 'verified_employers';
    await expect(
      service.getCandidateForViewer(profile.id, employer),
    ).rejects.toThrow('verified employer');

    employerRepository.findOneBy.mockResolvedValue({ isVerified: true });
    await expect(
      service.getCandidateForViewer(profile.id, employer),
    ).resolves.toMatchObject({
      id: profile.id,
      visibility: 'verified_employers',
    });
  });

  it('keeps the owner access when the profile is private', async () => {
    await expect(
      service.getCandidateForViewer(profile.id, candidate),
    ).resolves.toMatchObject({ userId: candidate.id });
  });

  it('checks role-purpose compatibility before storing a file', async () => {
    await expect(
      service.uploadAsset(
        employer,
        'resume',
        {
          buffer: Buffer.from('%PDF-1.4'),
          originalname: 'resume.pdf',
          mimetype: 'application/pdf',
          size: 8,
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('checks the real file signature instead of trusting the MIME', async () => {
    await expect(
      service.uploadAsset(
        candidate,
        'resume',
        {
          buffer: Buffer.from('not a pdf'),
          originalname: 'resume.pdf',
          mimetype: 'application/pdf',
          size: 9,
        },
        {},
      ),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(storage.put).not.toHaveBeenCalled();
  });
});

function authUser(
  id: string,
  role: 'candidate' | 'employer',
): AuthenticatedUser {
  return {
    id,
    authVersion: 0,
    displayName: id,
    email: `${id}@example.com`,
    role,
    status: 'active',
    emailVerifiedAt: new Date(),
    initialPath: role === 'candidate' ? '/app/candidato' : '/app/contratante',
  };
}

function candidateProfile(): CandidateProfile {
  const now = new Date();
  return {
    id: '2f06cad5-bb33-4d79-badb-d77ab25dfa61',
    userId: 'candidate-user',
    displayName: 'Pessoa Candidata',
    pronouns: null,
    headline: null,
    bio: null,
    location: null,
    workPreferences: {
      areas: [],
      workModes: [],
      contractTypes: [],
      availability: null,
    },
    skills: [],
    experiences: [],
    education: [],
    professionalLinks: [],
    visibility: 'private',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  } as unknown as CandidateProfile;
}
