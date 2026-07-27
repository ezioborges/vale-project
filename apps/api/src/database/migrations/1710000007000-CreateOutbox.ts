import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutbox1710000007000 implements MigrationInterface {
  name = 'CreateOutbox1710000007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "outbox_message_status" AS ENUM
       ('pending', 'processing', 'sent', 'retry_wait', 'dead')`,
    );
    await queryRunner.query(`
      CREATE TABLE "outbox_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "message_type" varchar(80) NOT NULL,
        "template_version" varchar(32) NOT NULL,
        "aggregate_type" varchar(80) NOT NULL,
        "aggregate_id" uuid NOT NULL,
        "deduplication_key" varchar(240) NOT NULL,
        "encrypted_payload" text,
        "payload_key_version" varchar(32) NOT NULL,
        "status" "outbox_message_status" NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "available_at" timestamptz NOT NULL DEFAULT now(),
        "lease_expires_at" timestamptz,
        "last_error_code" varchar(80),
        "sent_at" timestamptz,
        "expires_at" timestamptz,
        "request_id" varchar(128),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_outbox_messages_deduplication_key" UNIQUE ("deduplication_key"),
        CONSTRAINT "CHK_outbox_messages_attempts" CHECK ("attempts" >= 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_outbox_messages_dispatch"
       ON "outbox_messages" ("status", "available_at", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_outbox_messages_lease"
       ON "outbox_messages" ("lease_expires_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_outbox_messages_lease"');
    await queryRunner.query('DROP INDEX "IDX_outbox_messages_dispatch"');
    await queryRunner.query('DROP TABLE "outbox_messages"');
    await queryRunner.query('DROP TYPE "outbox_message_status"');
  }
}
