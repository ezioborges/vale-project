import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompletePhaseOne1710000002000 implements MigrationInterface {
  name = 'CompletePhaseOne1710000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN "display_name" varchar(120)',
    );
    await queryRunner.query(`
      UPDATE "users"
      SET "display_name" = split_part("email"::text, '@', 1)
      WHERE "display_name" IS NULL
    `);
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "display_name" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN "auth_version" integer NOT NULL DEFAULT 0',
    );

    await queryRunner.query(
      `ALTER TABLE "term_acceptances"
       ADD COLUMN "document_type" text NOT NULL DEFAULT 'terms'`,
    );
    await queryRunner.query(
      `ALTER TABLE "term_acceptances"
       DROP CONSTRAINT "UQ_term_acceptances_user_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "term_acceptances"
       ADD CONSTRAINT "UQ_term_acceptances_user_document_version"
       UNIQUE ("user_id", "document_type", "version")`,
    );

    await queryRunner.query(
      'ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" uuid',
    );
    await queryRunner.query(
      'UPDATE "refresh_tokens" SET "family_id" = "id" WHERE "family_id" IS NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_refresh_tokens_family_id" ON "refresh_tokens" ("family_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "consumed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_password_reset_tokens_token_hash"
       ON "password_reset_tokens" ("token_hash")`,
    );

    await queryRunner.query(`
      CREATE TABLE "audit_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_user_id" uuid NOT NULL,
        "target_user_id" uuid NOT NULL,
        "action" text NOT NULL,
        "context" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "ip_address" inet,
        "user_agent" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_audit_events_actor" FOREIGN KEY ("actor_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_audit_events_target" FOREIGN KEY ("target_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_audit_events_actor" ON "audit_events" ("actor_user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_audit_events_target" ON "audit_events" ("target_user_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "rate_limit_counters" (
        "key" text PRIMARY KEY,
        "hits" integer NOT NULL,
        "expires_at" timestamptz NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_rate_limit_counters_expires_at"
       ON "rate_limit_counters" ("expires_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_rate_limit_counters_expires_at"');
    await queryRunner.query('DROP TABLE "rate_limit_counters"');
    await queryRunner.query('DROP INDEX "IDX_audit_events_target"');
    await queryRunner.query('DROP INDEX "IDX_audit_events_actor"');
    await queryRunner.query('DROP TABLE "audit_events"');
    await queryRunner.query(
      'DROP INDEX "IDX_password_reset_tokens_token_hash"',
    );
    await queryRunner.query('DROP TABLE "password_reset_tokens"');
    await queryRunner.query('DROP INDEX "IDX_refresh_tokens_family_id"');
    await queryRunner.query(
      'ALTER TABLE "refresh_tokens" DROP COLUMN "family_id"',
    );
    await queryRunner.query(
      `ALTER TABLE "term_acceptances"
       DROP CONSTRAINT "UQ_term_acceptances_user_document_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "term_acceptances"
       ADD CONSTRAINT "UQ_term_acceptances_user_version"
       UNIQUE ("user_id", "version")`,
    );
    await queryRunner.query(
      'ALTER TABLE "term_acceptances" DROP COLUMN "document_type"',
    );
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "auth_version"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "display_name"');
  }
}
