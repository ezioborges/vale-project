import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TermAcceptance } from './term-acceptance.entity';
import { TermsService } from './terms.service';

@Module({
  imports: [TypeOrmModule.forFeature([TermAcceptance])],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}
