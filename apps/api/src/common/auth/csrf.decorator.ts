import { SetMetadata } from '@nestjs/common';

import { REQUIRE_CSRF_KEY } from './auth.constants';

export const CsrfProtected = () => SetMetadata(REQUIRE_CSRF_KEY, true);
