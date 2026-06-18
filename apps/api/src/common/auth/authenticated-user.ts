import type { UserRole, UserStatus } from '@vale/shared';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
