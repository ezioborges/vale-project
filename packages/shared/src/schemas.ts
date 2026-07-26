import { z } from 'zod';

import {
  applicationStatuses,
  contractTypes,
  employerProfileTypes,
  jobModerationDecisions,
  jobSeniorities,
  jobStatuses,
  legalDocumentTypes,
  profileAssetKinds,
  profileVisibilities,
  publicRegistrationRoles,
  reportDecisionActions,
  reportPriorities,
  reportReasons,
  reportStatuses,
  reportTargetTypes,
  userRoles,
  userStatuses,
  workModes,
} from './platform';

export const userRoleSchema = z.enum(userRoles);
export const publicRegistrationRoleSchema = z.enum(publicRegistrationRoles);
export const userStatusSchema = z.enum(userStatuses);
export const legalDocumentTypeSchema = z.enum(legalDocumentTypes);
export const jobStatusSchema = z.enum(jobStatuses);
export const applicationStatusSchema = z.enum(applicationStatuses);
export const profileVisibilitySchema = z.enum(profileVisibilities);
export const employerProfileTypeSchema = z.enum(employerProfileTypes);
export const profileAssetKindSchema = z.enum(profileAssetKinds);
export const workModeSchema = z.enum(workModes);
export const contractTypeSchema = z.enum(contractTypes);
export const jobSenioritySchema = z.enum(jobSeniorities);
export const jobModerationDecisionSchema = z.enum(jobModerationDecisions);
export const reportTargetTypeSchema = z.enum(reportTargetTypes);
export const reportReasonSchema = z.enum(reportReasons);
export const reportStatusSchema = z.enum(reportStatuses);
export const reportPrioritySchema = z.enum(reportPriorities);
export const reportDecisionActionSchema = z.enum(reportDecisionActions);

export const healthResponseSchema = z.object({
  app: z.literal('vale-api'),
  status: z.enum(['ok', 'error']),
  database: z.enum(['ok', 'error']),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(2),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  emailVerifiedAt: z.string().datetime().nullable(),
  initialPath: z.string().startsWith('/'),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const authResponseSchema = z.object({
  expiresInSeconds: z.number().int().positive(),
  user: userResponseSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const registrationConfigSchema = z.object({
  legalDocuments: z.object({
    terms: z.string().min(1),
    privacy: z.string().min(1),
    guidelines: z.string().min(1),
  }),
});

export type RegistrationConfig = z.infer<typeof registrationConfigSchema>;

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(12).max(128),
  role: publicRegistrationRoleSchema,
  acceptedTermsVersion: z.string().min(1),
  acceptedPrivacyVersion: z.string().min(1),
  acceptedGuidelinesVersion: z.string().min(1),
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
  acceptGuidelines: z.literal(true),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const messageResponseSchema = z.object({
  message: z.string().min(1),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).nullable();

export const workPreferencesSchema = z.object({
  areas: z.array(z.string().trim().min(1).max(80)).max(10),
  workModes: z.array(workModeSchema).max(workModes.length),
  contractTypes: z.array(contractTypeSchema).max(contractTypes.length),
  availability: optionalText(120),
});

export const candidateExperienceSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    organization: z.string().trim().min(1).max(120),
    startDate: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    endDate: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .nullable(),
    current: z.boolean(),
    description: optionalText(1000),
  })
  .refine((experience) => experience.current || experience.endDate !== null, {
    message: 'End date is required for a completed experience.',
    path: ['endDate'],
  });

export const candidateEducationSchema = z.object({
  institution: z.string().trim().min(1).max(120),
  course: z.string().trim().min(1).max(120),
  level: optionalText(80),
  startYear: z.number().int().min(1940).max(2200).nullable(),
  endYear: z.number().int().min(1940).max(2200).nullable(),
});

export const candidateProfileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  pronouns: optionalText(60),
  headline: optionalText(140),
  bio: optionalText(2000),
  location: optionalText(120),
  workPreferences: workPreferencesSchema,
  skills: z.array(z.string().trim().min(1).max(60)).max(30),
  experiences: z.array(candidateExperienceSchema).max(15),
  education: z.array(candidateEducationSchema).max(15),
  professionalLinks: z.array(z.string().url().max(500)).max(8),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileInputSchema>;

const employerProfileInputBaseSchema = z.object({
  type: employerProfileTypeSchema,
  responsibleName: z.string().trim().min(2).max(120),
  contactEmail: z.string().email().max(254),
  contactPhone: optionalText(30),
  organizationName: optionalText(160),
  segment: optionalText(120),
  description: optionalText(2000),
  website: z.string().url().max(500).nullable(),
  location: optionalText(120),
});

export const employerProfileInputSchema = employerProfileInputBaseSchema.refine(
  (profile) =>
    profile.type === 'individual' || Boolean(profile.organizationName),
  {
    message: 'Organization name is required for this employer type.',
    path: ['organizationName'],
  },
);

export type EmployerProfileInput = z.infer<typeof employerProfileInputSchema>;

export const profileAssetSchema = z.object({
  id: z.string().uuid(),
  kind: profileAssetKindSchema,
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  uploadedAt: z.string().datetime(),
  downloadPath: z.string().startsWith('/profiles/files/'),
});

export type ProfileAsset = z.infer<typeof profileAssetSchema>;

export const candidateProfileSchema = candidateProfileInputSchema.extend({
  id: z.string().uuid(),
  kind: z.literal('candidate'),
  userId: z.string().uuid(),
  visibility: profileVisibilitySchema,
  isActive: z.boolean(),
  completionPercentage: z.number().int().min(0).max(100),
  avatar: profileAssetSchema.nullable(),
  resume: profileAssetSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

export const employerProfileSchema = employerProfileInputBaseSchema.extend({
  id: z.string().uuid(),
  kind: z.literal('employer'),
  userId: z.string().uuid(),
  isVerified: z.boolean(),
  completionPercentage: z.number().int().min(0).max(100),
  logo: profileAssetSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EmployerProfile = z.infer<typeof employerProfileSchema>;

export const profileSchema = z.discriminatedUnion('kind', [
  candidateProfileSchema,
  employerProfileSchema,
]);

export type Profile = z.infer<typeof profileSchema>;

const jobOptionalText = (maximum: number) =>
  z.string().trim().max(maximum).nullable();

export const jobInputSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    area: z.string().trim().min(2).max(100),
    description: z.string().trim().min(50).max(5000),
    responsibilities: jobOptionalText(3000),
    requirements: jobOptionalText(3000),
    benefits: jobOptionalText(2000),
    location: z.string().trim().min(2).max(120),
    workMode: workModeSchema,
    contractType: contractTypeSchema,
    seniority: jobSenioritySchema,
    salaryMin: z.number().int().nonnegative().nullable(),
    salaryMax: z.number().int().nonnegative().nullable(),
    salaryHiddenReason: jobOptionalText(300),
    accessibilityInfo: jobOptionalText(1000),
    inclusionCommitment: z.literal(true),
  })
  .superRefine((job, context) => {
    const hasMinimum = job.salaryMin !== null;
    const hasMaximum = job.salaryMax !== null;

    if (hasMinimum !== hasMaximum) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe os dois valores da faixa salarial.',
        path: hasMinimum ? ['salaryMax'] : ['salaryMin'],
      });
    }

    if (
      job.salaryMin !== null &&
      job.salaryMax !== null &&
      job.salaryMin > job.salaryMax
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O salário mínimo não pode superar o máximo.',
        path: ['salaryMax'],
      });
    }

    if (!hasMinimum && !hasMaximum && !job.salaryHiddenReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Explique por que a faixa salarial não foi informada.',
        path: ['salaryHiddenReason'],
      });
    }

    if ((hasMinimum || hasMaximum) && job.salaryHiddenReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Não combine faixa salarial com justificativa de ocultação.',
        path: ['salaryHiddenReason'],
      });
    }
  });

export type JobInput = z.infer<typeof jobInputSchema>;

export const jobEmployerSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  isVerified: z.boolean(),
});

const jobResponseFields = {
  id: z.string().uuid(),
  title: z.string(),
  area: z.string(),
  description: z.string(),
  responsibilities: z.string().nullable(),
  requirements: z.string().nullable(),
  benefits: z.string().nullable(),
  location: z.string(),
  workMode: workModeSchema,
  contractType: contractTypeSchema,
  seniority: jobSenioritySchema,
  salaryMin: z.number().int().nonnegative().nullable(),
  salaryMax: z.number().int().nonnegative().nullable(),
  salaryHiddenReason: z.string().nullable(),
  accessibilityInfo: z.string().nullable(),
  inclusionCommitment: z.boolean(),
  employer: jobEmployerSchema,
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
};

export const publicJobSchema = z.object({
  ...jobResponseFields,
  status: z.literal('approved'),
});

export type PublicJob = z.infer<typeof publicJobSchema>;

export const managedJobSchema = z.object({
  ...jobResponseFields,
  status: jobStatusSchema,
  moderationReason: z.string().nullable(),
  moderatedAt: z.string().datetime().nullable(),
  closedAt: z.string().datetime().nullable(),
});

export type ManagedJob = z.infer<typeof managedJobSchema>;

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const publicJobPageSchema = paginationSchema.extend({
  items: z.array(publicJobSchema),
});

export type PublicJobPage = z.infer<typeof publicJobPageSchema>;

export const managedJobPageSchema = paginationSchema.extend({
  items: z.array(managedJobSchema),
});

export type ManagedJobPage = z.infer<typeof managedJobPageSchema>;

export const applicationHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  fromStatus: applicationStatusSchema.nullable(),
  toStatus: applicationStatusSchema,
  changedAt: z.string().datetime(),
});

export type ApplicationHistoryEntry = z.infer<
  typeof applicationHistoryEntrySchema
>;

export const candidateApplicationSchema = z.object({
  id: z.string().uuid(),
  status: applicationStatusSchema,
  coverMessage: z.string().nullable(),
  resumeFileName: z.string().nullable(),
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  job: z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: jobStatusSchema,
    employerName: z.string(),
  }),
  history: z.array(applicationHistoryEntrySchema),
});

export type CandidateApplication = z.infer<typeof candidateApplicationSchema>;

export const receivedApplicationSchema = z.object({
  id: z.string().uuid(),
  status: applicationStatusSchema,
  coverMessage: z.string().nullable(),
  resumeFileName: z.string().nullable(),
  resumeDownloadPath: z.string().startsWith('/applications/').nullable(),
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  candidate: z
    .object({
      id: z.string().uuid(),
      displayName: z.string(),
      headline: z.string().nullable(),
      location: z.string().nullable(),
      skills: z.array(z.string()),
    })
    .nullable(),
  history: z.array(applicationHistoryEntrySchema),
});

export type ReceivedApplication = z.infer<typeof receivedApplicationSchema>;

export const candidateApplicationPageSchema = paginationSchema.extend({
  items: z.array(candidateApplicationSchema),
});

export const receivedApplicationPageSchema = paginationSchema.extend({
  items: z.array(receivedApplicationSchema),
});

export type CandidateApplicationPage = z.infer<
  typeof candidateApplicationPageSchema
>;
export type ReceivedApplicationPage = z.infer<
  typeof receivedApplicationPageSchema
>;

export const createReportSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: z.string().uuid(),
  reason: reportReasonSchema,
  description: z.string().trim().min(20).max(2000),
});

export type CreateReport = z.infer<typeof createReportSchema>;

export const reportDecisionSchema = z.object({
  id: z.string().uuid(),
  action: reportDecisionActionSchema,
  reason: z.string(),
  actorUserId: z.string().uuid(),
  fromStatus: reportStatusSchema,
  toStatus: reportStatusSchema,
  createdAt: z.string().datetime(),
});

export type ReportDecision = z.infer<typeof reportDecisionSchema>;

export const myReportSchema = z.object({
  id: z.string().uuid(),
  targetType: reportTargetTypeSchema,
  targetId: z.string().uuid(),
  reason: reportReasonSchema,
  status: reportStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MyReport = z.infer<typeof myReportSchema>;

export const moderationReportSchema = myReportSchema.extend({
  description: z.string(),
  priority: reportPrioritySchema,
  targetUserId: z.string().uuid(),
  reporter: z.object({
    id: z.string().uuid(),
    displayName: z.string(),
  }),
  decisions: z.array(reportDecisionSchema),
});

export type ModerationReport = z.infer<typeof moderationReportSchema>;

export const myReportPageSchema = paginationSchema.extend({
  items: z.array(myReportSchema),
});
export const moderationReportPageSchema = paginationSchema.extend({
  items: z.array(moderationReportSchema),
});
export type MyReportPage = z.infer<typeof myReportPageSchema>;
export type ModerationReportPage = z.infer<typeof moderationReportPageSchema>;

export const adminUserSchema = userResponseSchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable(),
});
export const adminUserPageSchema = paginationSchema.extend({
  items: z.array(adminUserSchema),
});
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserPage = z.infer<typeof adminUserPageSchema>;

export const auditEventSchema = z.object({
  id: z.string().uuid(),
  actorUserId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  action: z.string(),
  context: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export const auditEventPageSchema = paginationSchema.extend({
  items: z.array(auditEventSchema),
});
export type AuditEventRecord = z.infer<typeof auditEventSchema>;
export type AuditEventPage = z.infer<typeof auditEventPageSchema>;
