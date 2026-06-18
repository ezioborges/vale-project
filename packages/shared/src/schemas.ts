import { z } from 'zod';

import {
  applicationStatuses,
  jobStatuses,
  profileVisibilities,
  publicRegistrationRoles,
  userRoles,
  userStatuses,
} from './platform';

export const userRoleSchema = z.enum(userRoles);
export const publicRegistrationRoleSchema = z.enum(publicRegistrationRoles);
export const userStatusSchema = z.enum(userStatuses);
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
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  emailVerifiedAt: z.string().datetime().nullable(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
  user: userResponseSchema,
  devEmailVerificationToken: z.string().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: publicRegistrationRoleSchema,
  acceptedTermsVersion: z.string().min(1),
  acceptTerms: z.literal(true),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
