import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  CandidateProfile as CandidateProfileResponse,
  CandidateProfileInput,
  EmployerProfile as EmployerProfileResponse,
  ProfileAsset as ProfileAssetResponse,
  ProfileAssetKind,
  ProfileVisibility,
} from '@vale/shared';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/auth/authenticated-user';
import { Application } from '../jobs/application.entity';
import { User } from '../users/user.entity';
import { CandidateProfile } from './candidate-profile.entity';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';
import { EmployerProfile } from './employer-profile.entity';
import { FILE_STORAGE, FileStorage } from './file-storage';
import { ProfileAsset } from './profile-asset.entity';

export type ProfileChangeContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type UploadedProfileFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export type ProfileFileDownload = {
  content: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly candidateRepository: Repository<CandidateProfile>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepository: Repository<EmployerProfile>,
    @InjectRepository(ProfileAsset)
    private readonly assetRepository: Repository<ProfileAsset>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  async getMyProfile(
    user: AuthenticatedUser,
  ): Promise<CandidateProfileResponse | EmployerProfileResponse> {
    if (user.role === 'candidate') {
      const profile = await this.candidateRepository.findOneBy({
        userId: user.id,
      });
      if (!profile) {
        throw new NotFoundException('Candidate profile not found.');
      }
      return this.toCandidateResponse(profile);
    }

    if (user.role === 'employer') {
      const profile = await this.employerRepository.findOneBy({
        userId: user.id,
      });
      if (!profile) {
        throw new NotFoundException('Employer profile not found.');
      }
      return this.toEmployerResponse(profile);
    }

    throw new ForbiddenException('This account does not own a profile.');
  }

  async upsertCandidate(
    user: AuthenticatedUser,
    input: UpdateCandidateProfileDto,
    context: ProfileChangeContext,
  ): Promise<CandidateProfileResponse> {
    this.validateExperiences(input.experiences);
    this.validateEducation(input.education);

    const saved = await this.dataSource.transaction(async (manager) => {
      await this.lockProfileOwner(manager, user.id);
      const repository = manager.getRepository(CandidateProfile);
      let profile = await repository.findOne({
        where: { userId: user.id },
        lock: { mode: 'pessimistic_write' },
      });
      const created = !profile;

      profile ??= repository.create({
        userId: user.id,
        displayName: user.displayName,
        pronouns: null,
        headline: null,
        bio: null,
        location: null,
        workPreferences: this.emptyWorkPreferences(),
        skills: [],
        experiences: [],
        education: [],
        professionalLinks: [],
        visibility: 'private',
        isActive: true,
      });

      const changedFields = this.applyCandidateInput(profile, input);
      const result = await repository.save(profile);

      if (input.displayName !== undefined) {
        await manager.getRepository(User).update(user.id, {
          displayName: result.displayName,
        });
      }

      if (created || changedFields.length > 0) {
        await this.recordProfileAudit(
          manager,
          user.id,
          created ? 'candidate_profile.created' : 'candidate_profile.updated',
          { changedFields },
          context,
        );
      }

      return result;
    });

    return this.toCandidateResponse(saved);
  }

  async upsertEmployer(
    user: AuthenticatedUser,
    input: UpdateEmployerProfileDto,
    context: ProfileChangeContext,
  ): Promise<EmployerProfileResponse> {
    const saved = await this.dataSource.transaction(async (manager) => {
      await this.lockProfileOwner(manager, user.id);
      const repository = manager.getRepository(EmployerProfile);
      let profile = await repository.findOne({
        where: { userId: user.id },
        lock: { mode: 'pessimistic_write' },
      });
      const created = !profile;

      profile ??= repository.create({
        userId: user.id,
        type: 'individual',
        responsibleName: user.displayName,
        contactEmail: user.email,
        contactPhone: null,
        organizationName: null,
        segment: null,
        description: null,
        website: null,
        location: null,
        isVerified: false,
      });

      const changedFields = this.applyEmployerInput(profile, input);
      if (
        profile.type !== 'individual' &&
        !this.cleanNullable(profile.organizationName)
      ) {
        throw new BadRequestException(
          'Organization name is required for companies and organizations.',
        );
      }

      const verificationWasReset =
        profile.isVerified &&
        changedFields.some((field) =>
          ['type', 'organizationName'].includes(field),
        );
      if (verificationWasReset) {
        profile.isVerified = false;
      }

      const result = await repository.save(profile);
      if (created || changedFields.length > 0) {
        await this.recordProfileAudit(
          manager,
          user.id,
          created ? 'employer_profile.created' : 'employer_profile.updated',
          { changedFields },
          context,
        );
      }
      if (verificationWasReset) {
        await this.recordProfileAudit(
          manager,
          user.id,
          'employer_profile.verification_reset',
          { reason: 'verified_identity_changed' },
          context,
        );
      }

      return result;
    });

    return this.toEmployerResponse(saved);
  }

  async updateVisibility(
    userId: string,
    visibility: ProfileVisibility,
    context: ProfileChangeContext,
  ): Promise<CandidateProfileResponse> {
    const profile = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CandidateProfile);
      const current = await repository.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) {
        throw new NotFoundException('Candidate profile not found.');
      }

      const previous = current.visibility;
      current.visibility = visibility;
      const saved = await repository.save(current);

      if (previous !== visibility) {
        await this.recordProfileAudit(
          manager,
          userId,
          'candidate_profile.visibility_changed',
          { from: previous, to: visibility },
          context,
        );
      }
      return saved;
    });

    return this.toCandidateResponse(profile);
  }

  async updateActivation(
    userId: string,
    isActive: boolean,
    context: ProfileChangeContext,
  ): Promise<CandidateProfileResponse> {
    const profile = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CandidateProfile);
      const current = await repository.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) {
        throw new NotFoundException('Candidate profile not found.');
      }

      const previous = current.isActive;
      current.isActive = isActive;
      const saved = await repository.save(current);

      if (previous !== isActive) {
        await this.recordProfileAudit(
          manager,
          userId,
          'candidate_profile.activation_changed',
          { from: previous, to: isActive },
          context,
        );
      }
      return saved;
    });

    return this.toCandidateResponse(profile);
  }

  async getCandidateForViewer(
    profileId: string,
    viewer: AuthenticatedUser,
  ): Promise<CandidateProfileResponse> {
    const profile = await this.candidateRepository.findOneBy({ id: profileId });
    if (!profile) {
      throw new NotFoundException('Candidate profile not found.');
    }

    await this.assertCandidateAccess(profile, viewer);
    return this.toCandidateResponse(profile);
  }

  async uploadAsset(
    user: AuthenticatedUser,
    kind: ProfileAssetKind,
    file: UploadedProfileFile | undefined,
    context: ProfileChangeContext,
  ): Promise<ProfileAssetResponse> {
    this.assertAssetKindAllowed(user, kind);
    if (!file?.buffer?.length) {
      throw new BadRequestException('A file is required.');
    }
    await this.assertProfileExists(user);

    const validated = this.validateFile(kind, file);
    const storageKey =
      `${user.id}/${kind}/${randomUUID()}` + validated.extension;
    await this.storage.put(storageKey, file.buffer, validated.mimeType);

    let previousStorageKey: string | null = null;
    let saved: ProfileAsset;
    try {
      saved = await this.dataSource.transaction(async (manager) => {
        await this.lockProfileOwner(manager, user.id);
        const repository = manager.getRepository(ProfileAsset);
        let asset = await repository.findOne({
          where: { userId: user.id, kind },
          lock: { mode: 'pessimistic_write' },
        });
        previousStorageKey = asset?.storageKey ?? null;
        asset ??= repository.create({ userId: user.id, kind });
        asset.originalName = this.safeFileName(file.originalname);
        asset.mimeType = validated.mimeType;
        asset.sizeBytes = file.size;
        asset.storageKey = storageKey;
        const result = await repository.save(asset);

        await this.recordProfileAudit(
          manager,
          user.id,
          'profile_asset.replaced',
          {
            kind,
            mimeType: validated.mimeType,
            sizeBytes: file.size,
          },
          context,
        );
        return result;
      });
    } catch (error) {
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }

    if (previousStorageKey) {
      await this.storage.delete(previousStorageKey).catch(() => undefined);
    }

    return this.toAssetResponse(saved);
  }

  async downloadAsset(
    assetId: string,
    viewer: AuthenticatedUser,
  ): Promise<ProfileFileDownload> {
    const asset = await this.assetRepository.findOneBy({ id: assetId });
    if (!asset) {
      throw new NotFoundException('Profile file not found.');
    }

    if (
      asset.userId !== viewer.id &&
      viewer.role !== 'admin' &&
      viewer.role !== 'coordinator'
    ) {
      if (asset.kind === 'logo') {
        // Institutional images do not contain candidate application data.
      } else {
        if (asset.kind === 'resume') {
          throw new ForbiddenException(
            'Use o currículo preservado na candidatura.',
          );
        }
        const profile = await this.candidateRepository.findOneBy({
          userId: asset.userId,
        });
        if (!profile) {
          throw new ForbiddenException('Profile file is not available.');
        }
        await this.assertCandidateAccess(profile, viewer);
      }
    }

    const content = await this.storage.get(asset.storageKey);
    return {
      content,
      fileName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
    };
  }

  async deleteAsset(
    assetId: string,
    owner: AuthenticatedUser,
    context: ProfileChangeContext,
  ): Promise<void> {
    const asset = await this.assetRepository.findOneBy({ id: assetId });
    if (!asset) {
      throw new NotFoundException('Profile file not found.');
    }
    if (asset.userId !== owner.id) {
      throw new ForbiddenException('Only the file owner can remove it.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ProfileAsset).remove(asset);
      await this.recordProfileAudit(
        manager,
        owner.id,
        'profile_asset.deleted',
        { kind: asset.kind },
        context,
      );
    });
    await this.storage.delete(asset.storageKey).catch(() => undefined);
  }

  private async assertCandidateAccess(
    profile: CandidateProfile,
    viewer: AuthenticatedUser,
  ): Promise<void> {
    if (
      viewer.id === profile.userId ||
      viewer.role === 'admin' ||
      viewer.role === 'coordinator'
    ) {
      return;
    }

    if (!profile.isActive || viewer.role !== 'employer') {
      throw new ForbiddenException('Candidate profile is not available.');
    }

    if (profile.visibility === 'applications_only') {
      const hasApplicationAccess = await this.dataSource
        .getRepository(Application)
        .createQueryBuilder('application')
        .innerJoin('application.job', 'job')
        .where('application.candidateProfileId = :profileId', {
          profileId: profile.id,
        })
        .andWhere('job.ownerUserId = :viewerId', { viewerId: viewer.id })
        .andWhere('application.status != :cancelled', {
          cancelled: 'cancelled',
        })
        .getExists();
      if (hasApplicationAccess) return;
      throw new ForbiddenException(
        'Candidate data is available only through an application.',
      );
    }
    if (profile.visibility !== 'verified_employers') {
      throw new ForbiddenException('Candidate profile is private.');
    }

    const employer = await this.employerRepository.findOneBy({
      userId: viewer.id,
    });
    if (!employer?.isVerified) {
      throw new ForbiddenException('A verified employer profile is required.');
    }
  }

  private async assertProfileExists(user: AuthenticatedUser): Promise<void> {
    const exists =
      user.role === 'candidate'
        ? await this.candidateRepository.exist({ where: { userId: user.id } })
        : await this.employerRepository.exist({ where: { userId: user.id } });
    if (!exists) {
      throw new BadRequestException('Save the profile before uploading files.');
    }
  }

  private assertAssetKindAllowed(
    user: AuthenticatedUser,
    kind: ProfileAssetKind,
  ): void {
    const allowed =
      (user.role === 'candidate' && ['avatar', 'resume'].includes(kind)) ||
      (user.role === 'employer' && kind === 'logo');
    if (!allowed) {
      throw new ForbiddenException(
        'This file kind is not allowed for the account role.',
      );
    }
  }

  private validateFile(
    kind: ProfileAssetKind,
    file: UploadedProfileFile,
  ): { extension: string; mimeType: string } {
    const imageSignatures: Record<string, (buffer: Buffer) => boolean> = {
      'image/jpeg': (buffer) =>
        buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
      'image/png': (buffer) =>
        buffer
          .subarray(0, 8)
          .equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          ),
      'image/webp': (buffer) =>
        buffer.subarray(0, 4).toString() === 'RIFF' &&
        buffer.subarray(8, 12).toString() === 'WEBP',
    };
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    const limit = kind === 'resume' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > limit) {
      throw new BadRequestException(
        `File exceeds the ${limit / 1024 / 1024} MB limit.`,
      );
    }

    const isValid =
      kind === 'resume'
        ? file.mimetype === 'application/pdf' &&
          file.buffer.subarray(0, 5).toString() === '%PDF-'
        : Boolean(imageSignatures[file.mimetype]?.(file.buffer));
    if (!isValid) {
      throw new UnsupportedMediaTypeException(
        kind === 'resume'
          ? 'Resume must be a valid PDF file.'
          : 'Image must be a valid JPEG, PNG or WebP file.',
      );
    }

    return {
      extension: extensions[file.mimetype]!,
      mimeType: file.mimetype,
    };
  }

  private applyCandidateInput(
    profile: CandidateProfile,
    input: UpdateCandidateProfileDto,
  ): string[] {
    const before = this.comparableCandidate(profile);

    if (input.displayName !== undefined) {
      profile.displayName = this.cleanRequired(input.displayName);
    }
    for (const key of ['pronouns', 'headline', 'bio', 'location'] as const) {
      if (input[key] !== undefined) {
        profile[key] = this.cleanNullable(input[key]);
      }
    }
    if (input.workPreferences !== undefined) {
      profile.workPreferences = {
        areas:
          input.workPreferences.areas?.map((value) =>
            this.cleanRequired(value),
          ) ?? profile.workPreferences.areas,
        workModes:
          input.workPreferences.workModes ?? profile.workPreferences.workModes,
        contractTypes:
          input.workPreferences.contractTypes ??
          profile.workPreferences.contractTypes,
        availability:
          input.workPreferences.availability === undefined
            ? profile.workPreferences.availability
            : this.cleanNullable(input.workPreferences.availability),
      };
    }
    if (input.skills !== undefined) {
      profile.skills = input.skills.map((value) => this.cleanRequired(value));
    }
    if (input.experiences !== undefined) {
      profile.experiences = input.experiences.map((experience) => ({
        title: this.cleanRequired(experience.title),
        organization: this.cleanRequired(experience.organization),
        startDate: experience.startDate,
        endDate: experience.current ? null : (experience.endDate ?? null),
        current: experience.current,
        description: this.cleanNullable(experience.description),
      }));
    }
    if (input.education !== undefined) {
      profile.education = input.education.map((education) => ({
        institution: this.cleanRequired(education.institution),
        course: this.cleanRequired(education.course),
        level: this.cleanNullable(education.level),
        startYear: education.startYear ?? null,
        endYear: education.endYear ?? null,
      }));
    }
    if (input.professionalLinks !== undefined) {
      profile.professionalLinks = [...input.professionalLinks];
    }

    const after = this.comparableCandidate(profile);
    return Object.keys(after).filter(
      (key) =>
        JSON.stringify(before[key as keyof typeof before]) !==
        JSON.stringify(after[key as keyof typeof after]),
    );
  }

  private applyEmployerInput(
    profile: EmployerProfile,
    input: UpdateEmployerProfileDto,
  ): string[] {
    const keys = [
      'type',
      'responsibleName',
      'contactEmail',
      'contactPhone',
      'organizationName',
      'segment',
      'description',
      'website',
      'location',
    ] as const;
    const before = Object.fromEntries(keys.map((key) => [key, profile[key]]));

    if (input.type !== undefined) profile.type = input.type;
    if (input.responsibleName !== undefined) {
      profile.responsibleName = this.cleanRequired(input.responsibleName);
    }
    if (input.contactEmail !== undefined) {
      profile.contactEmail = input.contactEmail.trim().toLowerCase();
    }
    for (const key of [
      'contactPhone',
      'organizationName',
      'segment',
      'description',
      'website',
      'location',
    ] as const) {
      if (input[key] !== undefined) {
        profile[key] = this.cleanNullable(input[key]);
      }
    }

    return keys.filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(profile[key]),
    );
  }

  private validateExperiences(
    experiences: UpdateCandidateProfileDto['experiences'],
  ): void {
    for (const experience of experiences ?? []) {
      if (!experience.current && !experience.endDate) {
        throw new BadRequestException(
          'Completed experiences require an end date.',
        );
      }
      if (
        experience.endDate &&
        experience.endDate.localeCompare(experience.startDate) < 0
      ) {
        throw new BadRequestException(
          'Experience end date cannot precede its start date.',
        );
      }
    }
  }

  private validateEducation(
    education: UpdateCandidateProfileDto['education'],
  ): void {
    for (const item of education ?? []) {
      if (item.startYear && item.endYear && item.endYear < item.startYear) {
        throw new BadRequestException(
          'Education end year cannot precede its start year.',
        );
      }
    }
  }

  private async toCandidateResponse(
    profile: CandidateProfile,
  ): Promise<CandidateProfileResponse> {
    const assets = await this.assetRepository.findBy({
      userId: profile.userId,
    });
    const avatar = assets.find((asset) => asset.kind === 'avatar');
    const resume = assets.find((asset) => asset.kind === 'resume');
    return {
      id: profile.id,
      kind: 'candidate',
      userId: profile.userId,
      displayName: profile.displayName,
      pronouns: profile.pronouns,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      workPreferences: profile.workPreferences,
      skills: profile.skills,
      experiences: profile.experiences,
      education: profile.education,
      professionalLinks: profile.professionalLinks,
      visibility: profile.visibility,
      isActive: profile.isActive,
      completionPercentage: this.candidateCompletion(profile, Boolean(resume)),
      avatar: avatar ? this.toAssetResponse(avatar) : null,
      resume: resume ? this.toAssetResponse(resume) : null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private async toEmployerResponse(
    profile: EmployerProfile,
  ): Promise<EmployerProfileResponse> {
    const logo = await this.assetRepository.findOneBy({
      userId: profile.userId,
      kind: 'logo',
    });
    return {
      id: profile.id,
      kind: 'employer',
      userId: profile.userId,
      type: profile.type,
      responsibleName: profile.responsibleName,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      organizationName: profile.organizationName,
      segment: profile.segment,
      description: profile.description,
      website: profile.website,
      location: profile.location,
      isVerified: profile.isVerified,
      completionPercentage: this.employerCompletion(profile),
      logo: logo ? this.toAssetResponse(logo) : null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private toAssetResponse(asset: ProfileAsset): ProfileAssetResponse {
    return {
      id: asset.id,
      kind: asset.kind,
      fileName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      uploadedAt: asset.updatedAt.toISOString(),
      downloadPath: `/profiles/files/${asset.id}`,
    };
  }

  private candidateCompletion(
    profile: CandidateProfile,
    hasResume: boolean,
  ): number {
    const checks = [
      Boolean(profile.displayName),
      Boolean(profile.headline),
      Boolean(profile.bio),
      Boolean(profile.location),
      profile.workPreferences.areas.length > 0,
      profile.skills.length > 0,
      profile.experiences.length > 0 || profile.education.length > 0,
      hasResume,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private employerCompletion(profile: EmployerProfile): number {
    const checks = [
      Boolean(profile.responsibleName),
      Boolean(profile.contactEmail),
      profile.type === 'individual' || Boolean(profile.organizationName),
      Boolean(profile.segment),
      Boolean(profile.description),
      Boolean(profile.location),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private comparableCandidate(profile: CandidateProfile) {
    return {
      displayName: profile.displayName,
      pronouns: profile.pronouns,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      workPreferences: profile.workPreferences,
      skills: profile.skills,
      experiences: profile.experiences,
      education: profile.education,
      professionalLinks: profile.professionalLinks,
    };
  }

  private emptyWorkPreferences(): CandidateProfileInput['workPreferences'] {
    return {
      areas: [],
      workModes: [],
      contractTypes: [],
      availability: null,
    };
  }

  private cleanRequired(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private cleanNullable(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const clean = value.trim().replace(/\s+/g, ' ');
    return clean || null;
  }

  private safeFileName(value: string): string {
    const withoutPath = value.split(/[\\/]/).pop() ?? '';
    const clean = [...withoutPath]
      .filter((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint > 31 && codePoint !== 127 && character !== '"';
      })
      .join('')
      .trim()
      .slice(0, 255);
    return clean || `profile-file${extname(value).slice(0, 10)}`;
  }

  private recordProfileAudit(
    manager: EntityManager,
    userId: string,
    action:
      | 'candidate_profile.created'
      | 'candidate_profile.updated'
      | 'candidate_profile.visibility_changed'
      | 'candidate_profile.activation_changed'
      | 'employer_profile.created'
      | 'employer_profile.updated'
      | 'employer_profile.verification_reset'
      | 'profile_asset.replaced'
      | 'profile_asset.deleted',
    auditContext: Record<string, unknown>,
    requestContext: ProfileChangeContext,
  ) {
    return this.auditService.record(
      {
        actorUserId: userId,
        targetUserId: userId,
        action,
        context: auditContext,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      },
      manager,
    );
  }

  private async lockProfileOwner(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    const owner = await manager.getRepository(User).findOne({
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!owner) {
      throw new NotFoundException('Profile owner not found.');
    }
  }
}
