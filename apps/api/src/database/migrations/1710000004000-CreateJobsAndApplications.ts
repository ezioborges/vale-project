import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsAndApplications1710000004000 implements MigrationInterface {
  name = 'CreateJobsAndApplications1710000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "work_mode" AS ENUM ('remote', 'hybrid', 'onsite')`,
    );
    await queryRunner.query(
      `CREATE TYPE "contract_type" AS ENUM
       ('clt', 'pj', 'internship', 'temporary', 'freelance', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "job_seniority" AS ENUM
       ('intern', 'junior', 'mid', 'senior', 'lead', 'specialist', 'not_applicable')`,
    );
    await queryRunner.query(
      `CREATE TYPE "job_status" AS ENUM
       ('draft', 'pending_review', 'changes_requested', 'approved', 'rejected',
        'paused', 'closed', 'reported')`,
    );
    await queryRunner.query(
      `CREATE TYPE "application_status" AS ENUM
       ('submitted', 'under_review', 'shortlisted', 'rejected', 'cancelled')`,
    );

    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "employer_profile_id" uuid NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "title" varchar(160) NOT NULL,
        "area" varchar(100) NOT NULL,
        "area_normalized" varchar(100) NOT NULL,
        "description" text NOT NULL,
        "responsibilities" text,
        "requirements" text,
        "benefits" text,
        "location" varchar(120) NOT NULL,
        "work_mode" "work_mode" NOT NULL,
        "contract_type" "contract_type" NOT NULL,
        "seniority" "job_seniority" NOT NULL,
        "salary_min" integer,
        "salary_max" integer,
        "salary_hidden_reason" varchar(300),
        "accessibility_info" text,
        "inclusion_commitment" boolean NOT NULL,
        "status" "job_status" NOT NULL DEFAULT 'pending_review',
        "moderation_reason" text,
        "moderated_by_user_id" uuid,
        "moderated_at" timestamptz,
        "published_at" timestamptz,
        "closed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_jobs_employer_profile" FOREIGN KEY ("employer_profile_id")
          REFERENCES "employer_profiles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_jobs_owner" FOREIGN KEY ("owner_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_jobs_moderator" FOREIGN KEY ("moderated_by_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_jobs_salary" CHECK (
          (
            "salary_min" IS NOT NULL AND "salary_max" IS NOT NULL
            AND "salary_min" >= 0 AND "salary_max" >= "salary_min"
            AND "salary_hidden_reason" IS NULL
          ) OR (
            "salary_min" IS NULL AND "salary_max" IS NULL
            AND "salary_hidden_reason" IS NOT NULL
            AND length(trim("salary_hidden_reason")) >= 10
          )
        ),
        CONSTRAINT "CHK_jobs_inclusion_commitment" CHECK ("inclusion_commitment" = true)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_owner" ON "jobs" ("owner_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_employer_profile" ON "jobs" ("employer_profile_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_public_order"
       ON "jobs" ("status", "published_at" DESC, "id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_filters"
       ON "jobs" ("status", "area_normalized", "work_mode", "contract_type", "seniority")`,
    );

    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "job_id" uuid NOT NULL,
        "candidate_profile_id" uuid NOT NULL,
        "status" "application_status" NOT NULL DEFAULT 'submitted',
        "cover_message" text,
        "submitted_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_applications_job" FOREIGN KEY ("job_id")
          REFERENCES "jobs"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_applications_candidate" FOREIGN KEY ("candidate_profile_id")
          REFERENCES "candidate_profiles"("id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_applications_job_candidate"
          UNIQUE ("job_id", "candidate_profile_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_candidate_order"
       ON "applications" ("candidate_profile_id", "submitted_at" DESC, "id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_job_status"
       ON "applications" ("job_id", "status", "submitted_at" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "application_status_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "actor_user_id" uuid NOT NULL,
        "from_status" "application_status",
        "to_status" "application_status" NOT NULL,
        "changed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_application_history_application"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_application_history_actor"
          FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_application_history_order"
       ON "application_status_history" ("application_id", "changed_at", "id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "application_resume_snapshots" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "original_name" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "size_bytes" integer NOT NULL,
        "storage_key" text NOT NULL,
        "retention_until" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_application_resume_application"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_application_resume_application" UNIQUE ("application_id"),
        CONSTRAINT "UQ_application_resume_storage_key" UNIQUE ("storage_key"),
        CONSTRAINT "CHK_application_resume_size" CHECK ("size_bytes" > 0),
        CONSTRAINT "CHK_application_resume_mime"
          CHECK ("mime_type" = 'application/pdf')
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "application_resume_snapshots"');
    await queryRunner.query('DROP INDEX "IDX_application_history_order"');
    await queryRunner.query('DROP TABLE "application_status_history"');
    await queryRunner.query('DROP INDEX "IDX_applications_job_status"');
    await queryRunner.query('DROP INDEX "IDX_applications_candidate_order"');
    await queryRunner.query('DROP TABLE "applications"');
    await queryRunner.query('DROP INDEX "IDX_jobs_filters"');
    await queryRunner.query('DROP INDEX "IDX_jobs_public_order"');
    await queryRunner.query('DROP INDEX "IDX_jobs_employer_profile"');
    await queryRunner.query('DROP INDEX "IDX_jobs_owner"');
    await queryRunner.query('DROP TABLE "jobs"');
    await queryRunner.query('DROP TYPE "application_status"');
    await queryRunner.query('DROP TYPE "job_status"');
    await queryRunner.query('DROP TYPE "job_seniority"');
    await queryRunner.query('DROP TYPE "contract_type"');
    await queryRunner.query('DROP TYPE "work_mode"');
  }
}
