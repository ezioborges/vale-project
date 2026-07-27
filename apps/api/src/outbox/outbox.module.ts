import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module';
import { ObservabilityModule } from '../common/observability/observability.module';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { OutboxMessage } from './outbox-message.entity';
import { OutboxPayloadCipherService } from './outbox-payload-cipher.service';
import { OutboxService } from './outbox.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxMessage]),
    EmailModule,
    ObservabilityModule,
  ],
  providers: [
    OutboxPayloadCipherService,
    OutboxService,
    OutboxDispatcherService,
  ],
  exports: [OutboxService, OutboxPayloadCipherService, OutboxDispatcherService],
})
export class OutboxModule {}
