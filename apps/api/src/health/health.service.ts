import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { HealthResponseDto } from './health.dto';

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  live(): HealthResponseDto {
    return this.response('ok');
  }

  async ready(): Promise<HealthResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
      return this.response('ok');
    } catch {
      throw new ServiceUnavailableException(this.response('error'));
    }
  }

  private response(status: 'ok' | 'error'): HealthResponseDto {
    return {
      app: 'vale-api',
      status,
      timestamp: new Date().toISOString(),
    };
  }
}
