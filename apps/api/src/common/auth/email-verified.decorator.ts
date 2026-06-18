import { SetMetadata } from '@nestjs/common';

import { REQUIRE_EMAIL_VERIFIED_KEY } from './auth.constants';

export const RequireEmailVerified = () =>
  SetMetadata(REQUIRE_EMAIL_VERIFIED_KEY, true);
