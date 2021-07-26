import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { OperationStatsModuleConfig } from './operation-stats.module';
import { OperationStatsService } from './operation-stats.service';

describe('TrustNetworkController', () => {
  let module: TestingModule;
  let operationStatsService: OperationStatsService;
  let app: INestApplication;

  function spy() {
    const operation = {
      getOperationStats: jest.spyOn(operationStatsService, 'getOperationStats').mockImplementation(async () => '200'),
    }

    return { operation };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(OperationStatsModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    operationStatsService = module.get<OperationStatsService>(OperationStatsService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /operation/stats', () => {
    test('should return the operation stats from storage', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/operation/stats')
        .send();

      expect(spies.operation.getOperationStats.mock.calls.length).toBe(1);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({
        stats: '200'
      });
    });

    test('should return error if service fails', async () => {
      const spies = spy();

      spies.operation.getOperationStats = jest.spyOn(operationStatsService, 'getOperationStats').mockRejectedValue('some error');

      const res = await request(app.getHttpServer())
        .get('/operation/stats')
        .send();

      expect(spies.operation.getOperationStats.mock.calls.length).toBe(1);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'failed to retrieve stats'
      });
    });
  });
});
