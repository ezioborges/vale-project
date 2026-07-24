import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RateLimitCounter } from './rate-limit-counter.entity';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [TypeOrmModule.forFeature([RateLimitCounter])],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
