import { describe, expect, it } from 'vitest';

import {
  contractTypes,
  employerProfileTypes,
  jobSeniorities,
  jobStatuses,
  reportDecisionActions,
  reportReasons,
  profileAssetKinds,
  publicRegistrationRoles,
  userRoles,
  workModes,
} from './platform';
import {
  authResponseSchema,
  candidateProfileInputSchema,
  employerProfileInputSchema,
  healthResponseSchema,
  jobInputSchema,
} from './schemas';

describe('shared platform contracts', () => {
  it('keeps public user roles explicit', () => {
    expect(userRoles).toEqual([
      'admin',
      'coordinator',
      'employer',
      'candidate',
    ]);
    expect(publicRegistrationRoles).toEqual(['employer', 'candidate']);
  });

  it('validates the health response contract', () => {
    expect(() =>
      healthResponseSchema.parse({
        app: 'vale-api',
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    ).not.toThrow();
  });

  it('validates the auth response contract', () => {
    expect(() =>
      authResponseSchema.parse({
        expiresInSeconds: 900,
        user: {
          id: '9b6bd21a-626b-4a43-84a7-6edcc5728426',
          displayName: 'Pessoa Candidata',
          email: 'candidate@example.com',
          role: 'candidate',
          status: 'pending_email',
          emailVerifiedAt: null,
          initialPath: '/onboarding/candidato',
        },
      }),
    ).not.toThrow();
  });

  it('shares the profile and upload domain values', () => {
    expect(employerProfileTypes).toEqual([
      'company',
      'organization',
      'individual',
    ]);
    expect(profileAssetKinds).toEqual(['avatar', 'logo', 'resume']);
    expect(workModes).toContain('remote');
    expect(contractTypes).toContain('clt');
    expect(jobStatuses).toContain('changes_requested');
    expect(jobSeniorities).toContain('senior');
    expect(reportReasons).toContain('discrimination');
    expect(reportDecisionActions).toContain('hide_job');
  });

  it('rejects incomplete structured profile data', () => {
    expect(() =>
      candidateProfileInputSchema.parse({
        displayName: 'Pessoa Candidata',
        pronouns: null,
        headline: null,
        bio: null,
        location: null,
        workPreferences: {
          areas: [],
          workModes: ['invalid'],
          contractTypes: [],
          availability: null,
        },
        skills: [],
        experiences: [],
        education: [],
        professionalLinks: [],
      }),
    ).toThrow();

    expect(() =>
      employerProfileInputSchema.parse({
        type: 'company',
        responsibleName: 'Pessoa Responsável',
        contactEmail: 'contact@example.com',
        contactPhone: null,
        organizationName: null,
        segment: null,
        description: null,
        website: null,
        location: null,
      }),
    ).toThrow();
  });

  it('requires a valid salary range or a reason for hiding it', () => {
    const valid = {
      title: 'Pessoa Desenvolvedora Backend',
      area: 'Tecnologia',
      description:
        'Atuação em produto digital com colaboração entre engenharia e produto.',
      responsibilities: null,
      requirements: null,
      benefits: null,
      location: 'São Paulo, SP',
      workMode: 'hybrid',
      contractType: 'clt',
      seniority: 'mid',
      salaryMin: 7000,
      salaryMax: 9000,
      salaryHiddenReason: null,
      accessibilityInfo: null,
      inclusionCommitment: true,
    };

    expect(() => jobInputSchema.parse(valid)).not.toThrow();
    expect(() =>
      jobInputSchema.parse({
        ...valid,
        salaryMin: null,
        salaryMax: null,
      }),
    ).toThrow();
  });
});
