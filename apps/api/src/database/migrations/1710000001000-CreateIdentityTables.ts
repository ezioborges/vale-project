import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdentityTables1710000001000 implements MigrationInterface {
  name = 'CreateIdentityTables1710000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "citext"');
    await queryRunner.query(
      "CREATE TYPE \"user_role\" AS ENUM ('admin', 'coordinator', 'employer', 'candidate')",
    );
    await queryRunner.query(
      "CREATE TYPE \"user_status\" AS ENUM ('pending_email', 'active', 'suspended', 'disabled')",
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" citext NOT NULL,
        "password_hash" text NOT NULL,
        "role" "user_role" NOT NULL,
        "status" "user_status" NOT NULL DEFAULT 'pending_email',
        "email_verified_at" timestamptz,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email") WHERE "deleted_at" IS NULL',
    );
    await queryRunner.query(`
      CREATE TABLE "term_acceptances" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "version" text NOT NULL,
        "accepted_at" timestamptz NOT NULL DEFAULT now(),
        "ip_address" inet,
        "user_agent" text,
        CONSTRAINT "FK_term_acceptances_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_term_acceptances_user_version" UNIQUE ("user_id", "version")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "replaced_by_token_id" uuid,
        "created_by_ip" inet,
        "revoked_by_ip" inet,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")',
    );
    await queryRunner.query(`
      CREATE TABLE "email_verification_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "consumed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_email_verification_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_email_verification_tokens_token_hash" ON "email_verification_tokens" ("token_hash")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "IDX_email_verification_tokens_token_hash"',
    );
    await queryRunner.query('DROP TABLE "email_verification_tokens"');
    await queryRunner.query('DROP INDEX "IDX_refresh_tokens_token_hash"');
    await queryRunner.query('DROP TABLE "refresh_tokens"');
    await queryRunner.query('DROP TABLE "term_acceptances"');
    await queryRunner.query('DROP INDEX "IDX_users_email"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TYPE "user_status"');
    await queryRunner.query('DROP TYPE "user_role"');
  }
}
