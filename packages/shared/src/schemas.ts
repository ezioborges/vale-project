import { z } from 'zod';

import {
  applicationStatuses,
  jobStatuses,
  legalDocumentTypes,
  profileVisibilities,
  publicRegistrationRoles,
  userRoles,
  userStatuses,
} from './platform';

export const userRoleSchema = z.enum(userRoles);
export const publicRegistrationRoleSchema = z.enum(publicRegistrationRoles);
export const userStatusSchema = z.enum(userStatuses);
export const legalDocumentTypeSchema = z.enum(legalDocumentTypes);
export const jobStatusSchema = z.enum(jobStatuses);
export const applicationStatusSchema = z.enum(applicationStatuses);
export const profileVisibilitySchema = z.enum(profileVisibilities);

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
