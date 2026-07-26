import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { envSchema } from '../common/config/env.validation';

export function getTypeOrmOptions(): TypeOrmModuleOptions {
  const env = envSchema.parse(process.env);

  return {
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: false,
    migrations:
      env.NODE_ENV === 'test' ? [] : ['dist/database/migrations/*.js'],
    ssl:
      env.DATABASE_SSL_MODE === 'verify-full'
        ? { ca: env.DATABASE_SSL_CA, rejectUnauthorized: true }
        : false,
  };
}
