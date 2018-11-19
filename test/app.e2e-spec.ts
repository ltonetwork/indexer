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

  describe('GET /', () => {
    test('should redirect to swagger api', async () => {
      const res = await request(app.getHttpServer()).get('/');
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('api-docs/');
    });
  });
});
