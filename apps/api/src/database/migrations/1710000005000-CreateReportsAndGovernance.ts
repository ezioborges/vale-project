import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportsAndGovernance1710000005000 implements MigrationInterface {
  name = 'CreateReportsAndGovernance1710000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "report_target_type" AS ENUM
       ('job', 'profile', 'user', 'application')`,
    );
    await queryRunner.query(
      `CREATE TYPE "report_reason" AS ENUM
       ('discrimination', 'harassment', 'fraud', 'inappropriate_content',
        'privacy', 'spam', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "report_status" AS ENUM
       ('open', 'in_review', 'resolved', 'dismissed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "report_priority" AS ENUM
       ('low', 'normal', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "report_decision_action" AS ENUM
       ('start_review', 'resolve', 'dismiss', 'hide_job', 'restore_job')`,
    );

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "reporter_user_id" uuid NOT NULL,
        "target_user_id" uuid NOT NULL,
        "target_type" "report_target_type" NOT NULL,
        "target_id" uuid NOT NULL,
        "reason" "report_reason" NOT NULL,
        "description" text NOT NULL,
        "status" "report_status" NOT NULL DEFAULT 'open',
        "priority" "report_priority" NOT NULL DEFAULT 'normal',
        "reviewed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_reports_reporter" FOREIGN KEY ("reporter_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_reports_target_user" FOREIGN KEY ("target_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_reports_description"
          CHECK (length(trim("description")) BETWEEN 20 AND 2000)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_queue"
       ON "reports" ("status", "priority", "created_at", "id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_reporter"
       ON "reports" ("reporter_user_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reports_target"
       ON "reports" ("target_type", "target_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_reports_active_unique"
       ON "reports" ("reporter_user_id", "target_type", "target_id")
       WHERE "status" IN ('open', 'in_review')`,
    );

    await queryRunner.query(`
      CREATE TABLE "moderation_decisions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "report_id" uuid NOT NULL,
        "actor_user_id" uuid NOT NULL,
        "action" "report_decision_action" NOT NULL,
        "reason" text NOT NULL,
        "from_status" "report_status" NOT NULL,
        "to_status" "report_status" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_moderation_decisions_report" FOREIGN KEY ("report_id")
          REFERENCES "reports"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_moderation_decisions_actor" FOREIGN KEY ("actor_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_moderation_decisions_reason"
          CHECK (length(trim("reason")) BETWEEN 10 AND 1000)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_moderation_decisions_report"
       ON "moderation_decisions" ("report_id", "created_at", "id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_moderation_decisions_report"');
    await queryRunner.query('DROP TABLE "moderation_decisions"');
    await queryRunner.query('DROP INDEX "IDX_reports_active_unique"');
    await queryRunner.query('DROP INDEX "IDX_reports_target"');
    await queryRunner.query('DROP INDEX "IDX_reports_reporter"');
    await queryRunner.query('DROP INDEX "IDX_reports_queue"');
    await queryRunner.query('DROP TABLE "reports"');
    await queryRunner.query('DROP TYPE "report_decision_action"');
    await queryRunner.query('DROP TYPE "report_priority"');
    await queryRunner.query('DROP TYPE "report_status"');
    await queryRunner.query('DROP TYPE "report_reason"');
    await queryRunner.query('DROP TYPE "report_target_type"');
  }
}
