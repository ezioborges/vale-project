import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializeDatabase1710000000000 implements MigrationInterface {
  name = 'InitializeDatabase1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // The extension can be shared by future tables, so the rollback leaves it intact.
  }
}
