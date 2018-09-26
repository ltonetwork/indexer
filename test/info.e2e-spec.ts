import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModuleConfig } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('Application e2e test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule(AppModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /info', () => {
    test('should return application info', async () => {
      const res = await request(app.getHttpServer()).get('/info');
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/json/);
      expect(res.body).toMatchObject({
        name: 'anchor',
        version: '1.0.0',
        description: 'Anchor data in the blockchain',
        env: 'test',
      });
    });
  });
});
