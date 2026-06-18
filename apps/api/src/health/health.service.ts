import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { HealthResponseDto } from './health.dto';

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async check(): Promise<HealthResponseDto> {
    const database = await this.checkDatabase();

    return {
      app: 'vale-api',
      status: database,
      database,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<'ok'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      throw new ServiceUnavailableException({
        app: 'vale-api',
        status: 'error',
        database: 'error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
