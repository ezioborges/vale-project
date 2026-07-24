import type { UserRole, UserStatus } from '@vale/shared';

export type AuthenticatedUser = {
  id: string;
  authVersion: number;
  displayName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  initialPath: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  authVersion: number;
};
