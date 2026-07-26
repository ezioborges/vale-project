import type { ProfileAssetKind, ProfileVisibility } from '@vale/shared';
import { IsBoolean, IsIn } from 'class-validator';

import {
  apiProfileAssetKinds,
  apiProfileVisibilities,
} from '../profile.constants';

export class UpdateProfileVisibilityDto {
  @IsIn(apiProfileVisibilities)
  visibility!: ProfileVisibility;
}

export class UpdateProfileActivationDto {
  @IsBoolean()
  isActive!: boolean;
}

export class UploadProfileAssetDto {
  @IsIn(apiProfileAssetKinds)
  kind!: ProfileAssetKind;
}
