import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfilesAndPrivacy1710000003000 implements MigrationInterface {
  name = 'CreateProfilesAndPrivacy1710000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "profile_visibility" AS ENUM
       ('private', 'applications_only', 'verified_employers')`,
    );
    await queryRunner.query(
      `CREATE TYPE "employer_profile_type" AS ENUM
       ('company', 'organization', 'individual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "profile_asset_kind" AS ENUM ('avatar', 'logo', 'resume')`,
    );

    await queryRunner.query(`
      CREATE TABLE "candidate_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "display_name" varchar(120) NOT NULL,
        "pronouns" varchar(60),
        "headline" varchar(140),
        "bio" text,
        "location" varchar(120),
        "work_preferences" jsonb NOT NULL DEFAULT
          '{"areas":[],"workModes":[],"contractTypes":[],"availability":null}'::jsonb,
        "skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "experiences" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "education" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "professional_links" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "visibility" "profile_visibility" NOT NULL DEFAULT 'private',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_candidate_profiles_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_candidate_profiles_user" UNIQUE ("user_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_candidate_profiles_visibility"
       ON "candidate_profiles" ("visibility")`,
    );

    await queryRunner.query(`
      CREATE TABLE "employer_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" "employer_profile_type" NOT NULL,
        "responsible_name" varchar(120) NOT NULL,
        "contact_email" varchar(254) NOT NULL,
        "contact_phone" varchar(30),
        "organization_name" varchar(160),
        "segment" varchar(120),
        "description" text,
        "website" varchar(500),
        "location" varchar(120),
        "is_verified" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_employer_profiles_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_employer_profiles_user" UNIQUE ("user_id"),
        CONSTRAINT "CHK_employer_profiles_organization_name" CHECK (
          "type" = 'individual' OR
          ("organization_name" IS NOT NULL AND length(trim("organization_name")) > 0)
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_employer_profiles_verified"
       ON "employer_profiles" ("is_verified")`,
    );

    await queryRunner.query(`
      CREATE TABLE "profile_assets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "kind" "profile_asset_kind" NOT NULL,
        "original_name" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "size_bytes" integer NOT NULL,
        "storage_key" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_profile_assets_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_profile_assets_user_kind" UNIQUE ("user_id", "kind"),
        CONSTRAINT "UQ_profile_assets_storage_key" UNIQUE ("storage_key"),
        CONSTRAINT "CHK_profile_assets_size" CHECK ("size_bytes" > 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_profile_assets_user" ON "profile_assets" ("user_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_profile_assets_user"');
    await queryRunner.query('DROP TABLE "profile_assets"');
    await queryRunner.query('DROP INDEX "IDX_employer_profiles_verified"');
    await queryRunner.query('DROP TABLE "employer_profiles"');
    await queryRunner.query('DROP INDEX "IDX_candidate_profiles_visibility"');
    await queryRunner.query('DROP TABLE "candidate_profiles"');
    await queryRunner.query('DROP TYPE "profile_asset_kind"');
    await queryRunner.query('DROP TYPE "employer_profile_type"');
    await queryRunner.query('DROP TYPE "profile_visibility"');
  }
}
