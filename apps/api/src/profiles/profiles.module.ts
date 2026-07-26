import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { Env } from '../common/config/env.validation';
import { CandidateProfile } from './candidate-profile.entity';
import { EmployerProfile } from './employer-profile.entity';
import { FILE_STORAGE } from './file-storage';
import { LocalFileStorage } from './local-file.storage';
import { ProfileAsset } from './profile-asset.entity';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { S3FileStorage } from './s3-file.storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateProfile, EmployerProfile, ProfileAsset]),
    AuditModule,
  ],
  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    {
      provide: FILE_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        if (config.get('STORAGE_DRIVER', { infer: true }) === 's3') {
          return new S3FileStorage({
            endpoint: config.get('S3_ENDPOINT', { infer: true })!,
            bucket: config.get('S3_BUCKET', { infer: true })!,
            region: config.get('S3_REGION', { infer: true })!,
            accessKeyId: config.get('S3_ACCESS_KEY_ID', { infer: true })!,
            secretAccessKey: config.get('S3_SECRET_ACCESS_KEY', {
              infer: true,
            })!,
          });
        }
        return new LocalFileStorage(
          config.get('PROFILE_STORAGE_ROOT', { infer: true }),
        );
      },
    },
  ],
  exports: [ProfilesService, FILE_STORAGE],
})
export class ProfilesModule {}
