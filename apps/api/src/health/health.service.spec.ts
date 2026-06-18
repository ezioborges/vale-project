import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok when the database responds', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: {
            query: jest.fn().mockResolvedValue([{ ok: 1 }]),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(HealthService);

    await expect(service.check()).resolves.toMatchObject({
      app: 'vale-api',
      status: 'ok',
      database: 'ok',
    });
  });

  it('fails closed when the database does not respond', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: {
            query: jest.fn().mockRejectedValue(new Error('database offline')),
          } satisfies Pick<DataSource, 'query'>,
        },
      ],
    }).compile();

    const service = moduleRef.get(HealthService);

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
