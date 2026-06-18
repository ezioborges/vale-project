import { SetMetadata } from '@nestjs/common';

import { REQUIRE_TERMS_KEY } from './auth.constants';

export const RequireAcceptedTerms = () => SetMetadata(REQUIRE_TERMS_KEY, true);
