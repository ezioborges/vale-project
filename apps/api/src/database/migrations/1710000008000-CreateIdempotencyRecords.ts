import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdempotencyRecords1710000008000 implements MigrationInterface {
  name = 'CreateIdempotencyRecords1710000008000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "idempotency_record_status" AS ENUM
       ('processing', 'completed', 'failed_retryable')`,
    );
    await queryRunner.query(`
      CREATE TABLE "idempotency_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_user_id" uuid NOT NULL,
        "method" varchar(8) NOT NULL,
        "route" varchar(160) NOT NULL,
        "key_hash" char(64) NOT NULL,
        "fingerprint" char(64) NOT NULL,
        "status" "idempotency_record_status" NOT NULL,
        "resource_type" varchar(80),
        "resource_id" uuid,
        "http_status" smallint,
        "contract_version" varchar(32) NOT NULL,
        "lease_expires_at" timestamptz,
        "completed_at" timestamptz,
        "expires_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_idempotency_records_actor" FOREIGN KEY ("actor_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_idempotency_records_operation"
          UNIQUE ("actor_user_id", "method", "route", "key_hash")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_idempotency_records_cleanup"
       ON "idempotency_records" ("status", "expires_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_idempotency_records_cleanup"');
    await queryRunner.query('DROP TABLE "idempotency_records"');
    await queryRunner.query('DROP TYPE "idempotency_record_status"');
  }
}
