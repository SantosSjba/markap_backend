import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../src/infrastructure/http/controllers/health.controller';

describe('Health HTTP', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('expone el estado en la ruta real /api/health', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'markap-api',
    });
    expect(
      Number.isNaN(
        Date.parse((response.body as { timestamp: string }).timestamp),
      ),
    ).toBe(false);
  });

  it('no declara la ruta de ejemplo Hello World del proyecto inicial', async () => {
    await request(app.getHttpServer()).get('/').expect(404);
  });
});
