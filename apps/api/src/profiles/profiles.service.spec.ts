import {
  ForbiddenException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';
import { CandidateProfile } from './candidate-profile.entity';
import { EmployerProfile } from './employer-profile.entity';
import { FileStorage } from './file-storage';
import { ProfileAsset } from './profile-asset.entity';
import { FileSafetyError, ProfileFilePipeline } from './profile-file.pipeline';
import { ProfilesService } from './profiles.service';

describe('ProfilesService privacy boundaries', () => {
  const candidate = authUser('candidate-user', 'candidate');
  const employer = authUser('employer-user', 'employer');
  const coordinator = authUser('coordinator-user', 'coordinator');
  const profile = candidateProfile();
  const avatar = profileAsset(
    '3b5278fe-79cd-4a67-b2a0-c18ad88667b8',
    'avatar',
    'avatar.png',
  );
  const resume = profileAsset(
    '26718272-0e45-4582-a8c8-84be92453f38',
    'resume',
    'curriculo.pdf',
  );
  const candidateRepository = {
    exist: jest.fn(async () => true),
    findOneBy: jest.fn(async () => profile),
  };
  const employerRepository = {
    findOneBy: jest.fn(async () => ({ isVerified: false })),
  };
  const assetRepository = {
    findBy: jest.fn(async () => [avatar, resume]),
    findOneBy: jest.fn(async () => avatar),
  };
  const applicationQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getExists: jest.fn(async () => false),
  };
  const dataSource = {
    getRepository: jest.fn(() => ({
      createQueryBuilder: jest.fn(() => applicationQueryBuilder),
    })),
  };
  const storage = {
    delete: jest.fn(async () => undefined),
    get: jest.fn(),
    put: jest.fn(),
  };
  const filePipeline = {
    inspectAndPromote: jest.fn(),
  };
  const auditService = {
    record: jest.fn(),
  };
  const service = new ProfilesService(
    candidateRepository as unknown as Repository<CandidateProfile>,
    employerRepository as unknown as Repository<EmployerProfile>,
    assetRepository as unknown as Repository<ProfileAsset>,
    dataSource as unknown as DataSource,
    auditService as unknown as AuditService,
    storage as unknown as FileStorage,
    filePipeline as unknown as ProfileFilePipeline,
    { enforce: jest.fn() } as unknown as RateLimitService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    profile.visibility = 'private';
    profile.isActive = true;
    employerRepository.findOneBy.mockResolvedValue({ isVerified: false });
    applicationQueryBuilder.getExists.mockResolvedValue(false);
    assetRepository.findBy.mockResolvedValue([avatar, resume]);
    assetRepository.findOneBy.mockResolvedValue(avatar);
    filePipeline.inspectAndPromote.mockReset();
    auditService.record.mockReset();
  });

  it('grants application-only access through an active application owned by the employer', async () => {
    profile.visibility = 'applications_only';
    applicationQueryBuilder.getExists.mockResolvedValue(true);

    const response = await service.getCandidateForViewer(profile.id, employer);
    expect(response).toMatchObject({
      id: profile.id,
      avatar: { downloadPath: `/profiles/files/${avatar.id}` },
    });
    expect(response).not.toHaveProperty('userId');
    expect(response).not.toHaveProperty('visibility');
    expect(response).not.toHaveProperty('resume');
    expect(response.avatar).not.toHaveProperty('id');
    expect(response.avatar).not.toHaveProperty('fileName');
    expect(response.avatar).not.toHaveProperty('sizeBytes');
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
    });
  });

  it('keeps the owner access when the profile is private', async () => {
    const response = await service.getCandidateForViewer(profile.id, candidate);
    expect(response).toMatchObject({
      userId: candidate.id,
      resume: {
        fileName: 'curriculo.pdf',
        id: resume.id,
        sizeBytes: resume.sizeBytes,
      },
    });
  });

  it('gives the team action metadata without reusing the owner contract', async () => {
    const response = await service.getCandidateForViewer(
      profile.id,
      coordinator,
    );

    expect(response).toMatchObject({
      userId: candidate.id,
      resume: {
        downloadPath: `/profiles/files/${resume.id}`,
        id: resume.id,
      },
    });
    expect(response).not.toHaveProperty('completionPercentage');
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
    expect(filePipeline.inspectAndPromote).not.toHaveBeenCalled();
  });

  it('checks the real file signature instead of trusting the MIME', async () => {
    filePipeline.inspectAndPromote.mockRejectedValue(
      new FileSafetyError('invalid_pdf', 'validation'),
    );
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
    expect(filePipeline.inspectAndPromote).toHaveBeenCalledTimes(1);
  });

  it('audits scanner failure without copying file content or scanner output', async () => {
    filePipeline.inspectAndPromote.mockRejectedValue(
      new FileSafetyError('scanner_unavailable', 'scan'),
    );

    await expect(
      service.uploadAsset(
        candidate,
        'resume',
        {
          buffer: Buffer.from('%PDF-1.4\nsensitive fixture\n%%EOF'),
          originalname: 'curriculo.pdf',
          mimetype: 'application/pdf',
          size: 39,
        },
        { ipAddress: '127.0.0.1' },
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'profile_asset.scan_failed',
        context: {
          kind: 'resume',
          reason: 'scanner_unavailable',
        },
      }),
    );
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain(
      'sensitive fixture',
    );
  });
});

function authUser(
  id: string,
  role: 'candidate' | 'coordinator' | 'employer',
): AuthenticatedUser {
  return {
    id,
    authVersion: 0,
    displayName: id,
    email: `${id}@example.com`,
    role,
    status: 'active',
    emailVerifiedAt: new Date(),
    initialPath:
      role === 'candidate'
        ? '/app/candidato'
        : role === 'employer'
          ? '/app/contratante'
          : '/app/equipe',
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

function profileAsset(
  id: string,
  kind: 'avatar' | 'resume',
  originalName: string,
): ProfileAsset {
  return {
    id,
    userId: 'candidate-user',
    kind,
    originalName,
    mimeType: kind === 'resume' ? 'application/pdf' : 'image/png',
    sizeBytes: 512,
    storageKey: `candidate-user/${kind}/${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ProfileAsset;
}
