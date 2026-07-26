import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshToken } from '../../auth/refresh-token.entity';
import { RateLimitCounter } from './rate-limit-counter.entity';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [TypeOrmModule.forFeature([RateLimitCounter, RefreshToken])],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
