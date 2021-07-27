import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { OperationsService } from './operations/operations.service';
import { StatsModuleConfig } from './stats.module';
import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';

describe('TrustNetworkController', () => {
  let module: TestingModule;
  let statsService: StatsService;
  let supplyService: SupplyService;
  let operationsService: OperationsService;
  let app: INestApplication;

  function spy() {
    const operations = {
      getOperationStats: jest.spyOn(operationsService, 'getOperationStats').mockImplementation(async () => '200'),
    };

    const supply = {
      getMaxSupply: jest.spyOn(supplyService, 'getMaxSupply').mockImplementation(async () => '87654321.87654321'),
      getCirculatingSupply: jest.spyOn(supplyService, 'getCirculatingSupply').mockImplementation(async () => '12345678.12345678'),
    };

    return { operations, supply };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StatsModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    statsService = module.get<StatsService>(StatsService);
    supplyService = module.get<SupplyService>(SupplyService);
    operationsService = module.get<OperationsService>(OperationsService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /stats/operations', () => {
    test('should return the operation stats from storage', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/stats/operations')
        .send();

      expect(spies.operations.getOperationStats.mock.calls.length).toBe(1);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({
        operations: '200'
      });
    });

    test('should return error if service fails', async () => {
      const spies = spy();

      spies.operations.getOperationStats = jest.spyOn(operationsService, 'getOperationStats').mockRejectedValue('some error');

      const res = await request(app.getHttpServer())
        .get('/stats/operations')
        .send();

      expect(spies.operations.getOperationStats.mock.calls.length).toBe(1);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'failed to retrieve operation stats'
      });
    });
  });

  describe('GET /stats/supply/circulating/', () => {
    test('should return the result', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/stats/supply/circulating/')
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ circulatingSupply: '12345678.12345678' });

      expect(spies.supply.getCirculatingSupply.mock.calls.length).toBe(1);
    });

    test('should return the raw result if parameter is given', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/stats/supply/circulating?output=raw')
        .send();

      expect(res.header['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.text).toBe('12345678.12345678');
    });

    test('should return 500 if the service fails', async () => {
      const spies = spy();

      spies.supply.getCirculatingSupply.mockRejectedValue('some error');

      const res = await request(app.getHttpServer())
        .get('/stats/supply/circulating/')
        .send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'failed to get circulating supply: some error' });
    });
  });

  describe('GET /stats/supply/max/', () => {
    test('should return the result', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/stats/supply/max/')
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ maxSupply: '87654321.87654321' });

      expect(spies.supply.getMaxSupply.mock.calls.length).toBe(1);
    });

    test('should return the raw result if parameter is given', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/stats/supply/max?output=raw')
        .send();

      expect(res.header['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.text).toBe('87654321.87654321');
    });

    test('should return 500 if the service fails', async () => {
      const spies = spy();

      spies.supply.getMaxSupply.mockRejectedValue('some error');

      const res = await request(app.getHttpServer())
        .get('/stats/supply/max/')
        .send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'failed to get max supply: some error' });
    });
  });
});
