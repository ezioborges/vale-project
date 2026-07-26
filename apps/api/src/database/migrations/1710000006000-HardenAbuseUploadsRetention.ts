import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenAbuseUploadsRetention1710000006000 implements MigrationInterface {
  name = 'HardenAbuseUploadsRetention1710000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_application_resume_retention"
       ON "application_resume_snapshots" ("retention_until", "id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_application_resume_retention"');
  }
}
