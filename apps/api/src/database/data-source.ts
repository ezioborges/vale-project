import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { envSchema } from '../common/config/env.validation';

const env = envSchema.parse(process.env);

export default new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  synchronize: false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  ssl:
    env.DATABASE_SSL_MODE === 'verify-full'
      ? { ca: env.DATABASE_SSL_CA, rejectUnauthorized: true }
      : false,
});
