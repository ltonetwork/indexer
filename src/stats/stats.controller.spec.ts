import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TransactionService } from '../transaction/transaction.service';
import { StatsModuleConfig } from './stats.module';
import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';

describe('TrustNetworkController', () => {
  let module: TestingModule;
  let statsService: StatsService;
  let supplyService: SupplyService;
  let transactionService: TransactionService;
  let app: INestApplication;

  function spy() {
    const operations = {
      getOperationStats: jest.spyOn(statsService, 'getOperationStats').mockImplementation(async () => [
        { period: '2021-03-01 00:00:00', count: 4000 },
        { period: '2021-03-02 00:00:00', count: 5000 },
        { period: '2021-03-03 00:00:00', count: 6000 },
      ]),
    };

    const supply = {
      getMaxSupply: jest.spyOn(supplyService, 'getMaxSupply').mockImplementation(async () => '87654321.87654321'),
      getCirculatingSupply: jest
        .spyOn(supplyService, 'getCirculatingSupply')
        .mockImplementation(async () => '12345678.12345678'),
    };

    const transactions = {
      getStats: jest.spyOn(transactionService, 'getStats').mockImplementation(async () => [
        { period: '2021-03-01 00:00:00', count: 56847 },
        { period: '2021-03-02 00:00:00', count: 103698 },
        { period: '2021-03-03 00:00:00', count: 33329 },
      ]),
    };

    return { operations, supply, transactions };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StatsModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    statsService = module.get<StatsService>(StatsService);
    supplyService = module.get<SupplyService>(SupplyService);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /stats/operations/:from/:to', () => {
    test('should return the operation stats from storage', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer()).get('/stats/operations/2021-03-01/2021-03-03').send();

      expect(spies.operations.getOperationStats.mock.calls.length).toBe(1);
      expect(spies.operations.getOperationStats.mock.calls[0][0]).toBe(18687);
      expect(spies.operations.getOperationStats.mock.calls[0][1]).toBe(18689);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual([
        { period: '2021-03-01 00:00:00', count: 4000 },
        { period: '2021-03-02 00:00:00', count: 5000 },
        { period: '2021-03-03 00:00:00', count: 6000 },
      ]);
    });

    test('should return error if service fails', async () => {
      const spies = spy();

      spies.operations.getOperationStats = jest
        .spyOn(statsService, 'getOperationStats')
        .mockRejectedValue('some error');

      const res = await request(app.getHttpServer()).get('/stats/operations/2021-03-01/2021-02-01').send();

      expect(spies.operations.getOperationStats.mock.calls.length).toBe(0);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'invalid period range given' });
    });
  });

  describe('GET /stats/supply/circulating/', () => {
    test('should return the result', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer()).get('/stats/supply/circulating/').send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ circulatingSupply: '12345678.12345678' });

      expect(spies.supply.getCirculatingSupply.mock.calls.length).toBe(1);
    });

    test('should return the raw result if parameter is given', async () => {
      spy();

      const res = await request(app.getHttpServer()).get('/stats/supply/circulating?output=raw').send();

      expect(res.header['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.text).toBe('12345678.12345678');
    });

    test('should return 500 if the service fails', async () => {
      const spies = spy();

      spies.supply.getCirculatingSupply.mockRejectedValue('some error');

      const res = await request(app.getHttpServer()).get('/stats/supply/circulating/').send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'failed to get circulating supply: some error' });
    });
  });

  describe('GET /stats/supply/max/', () => {
    test('should return the result', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer()).get('/stats/supply/max/').send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ maxSupply: '87654321.87654321' });

      expect(spies.supply.getMaxSupply.mock.calls.length).toBe(1);
    });

    test('should return the raw result if parameter is given', async () => {
      spy();

      const res = await request(app.getHttpServer()).get('/stats/supply/max?output=raw').send();

      expect(res.header['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.text).toBe('87654321.87654321');
    });

    test('should return 500 if the service fails', async () => {
      const spies = spy();

      spies.supply.getMaxSupply.mockRejectedValue('some error');

      const res = await request(app.getHttpServer()).get('/stats/supply/max/').send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'failed to get max supply: some error' });
    });
  });

  describe('GET /stats/transactions/:type/:from/:to', () => {
    test('should get stats using timestamps', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer()).get(`/stats/transactions/all/1614597904336/1614793341900`).send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual([
        { period: '2021-03-01 00:00:00', count: 56847 },
        { period: '2021-03-02 00:00:00', count: 103698 },
        { period: '2021-03-03 00:00:00', count: 33329 },
      ]);

      expect(spies.transactions.getStats.mock.calls.length).toBe(1);
      expect(spies.transactions.getStats.mock.calls[0][0]).toBe('all');
      expect(spies.transactions.getStats.mock.calls[0][1]).toBe(18687);
      expect(spies.transactions.getStats.mock.calls[0][2]).toBe(18689);
    });

    test('should get stats using date strings', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer()).get(`/stats/transactions/all/2021-03-01/2021-03-03`).send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual([
        { period: '2021-03-01 00:00:00', count: 56847 },
        { period: '2021-03-02 00:00:00', count: 103698 },
        { period: '2021-03-03 00:00:00', count: 33329 },
      ]);

      expect(spies.transactions.getStats.mock.calls.length).toBe(1);
      expect(spies.transactions.getStats.mock.calls[0][0]).toBe('all');
      expect(spies.transactions.getStats.mock.calls[0][1]).toBe(18687);
      expect(spies.transactions.getStats.mock.calls[0][2]).toBe(18689);
    });
  });
});
