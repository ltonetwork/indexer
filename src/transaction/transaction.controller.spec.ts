import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TransactionModuleConfig } from './transaction.module';
import { NodeService } from '../node/node.service';
import { TransactionService } from './transaction.service';

describe('TransactionController', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let txService: TransactionService;
  let app: INestApplication;

  function spy() {
    const node = {
      getTransactionsByAddress: jest.spyOn(nodeService, 'getTransactionsByAddress')
        .mockImplementation(async () => ['fake_transaction_1', 'fake_transaction_2']),
      countTransactionsByAddress: jest.spyOn(nodeService, 'countTransactionsByAddress')
        .mockImplementation(async () => 2),
      getTransactions: jest.spyOn(nodeService, 'getTransactions')
        // @ts-ignore
        .mockImplementation(async () => [{ id: 'fake_transaction_1' }, { id: 'fake_transaction_2' }]),
    };

    const tx = {
      getStats: jest.spyOn(txService, 'getStats')
        .mockImplementation(async () => [
          { period: '2021-03-01 00:00:00', count: 56847 },
          { period: '2021-03-02 00:00:00', count: 103698 },
          { period: '2021-03-03 00:00:00', count: 33329 },
        ]),
    };

    return { node, tx };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TransactionModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    nodeService = module.get<NodeService>(NodeService);
    txService = module.get<TransactionService>(TransactionService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /transactions/addresses/:address', () => {
    test('should get transactions for given address using default params', async () => {
      const spies = spy();

      const address = '3N42b1qAmNLq1aJYACf8YQD4RUYBqL1qsmE';
      const res = await request(app.getHttpServer())
        .get(`/transactions/addresses/${address}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.header['x-total']).toBe('2');
      expect(res.body).toEqual([{ id: 'fake_transaction_1' }, { id: 'fake_transaction_2' }]);

      expect(spies.node.getTransactionsByAddress.mock.calls.length).toBe(1);
      expect(spies.node.getTransactionsByAddress.mock.calls[0][0]).toBe(address);
      expect(spies.node.getTransactionsByAddress.mock.calls[0][1]).toBe('all');
      expect(spies.node.getTransactionsByAddress.mock.calls[0][2]).toBe(undefined);
      expect(spies.node.getTransactionsByAddress.mock.calls[0][3]).toBe(undefined);
      expect(spies.node.getTransactionsByAddress.mock.calls.length).toBe(1);

      expect(spies.node.countTransactionsByAddress.mock.calls.length).toBe(1);
      expect(spies.node.countTransactionsByAddress.mock.calls[0][0]).toBe(address);

      expect(spies.node.getTransactions.mock.calls.length).toBe(1);
      expect(spies.node.getTransactions.mock.calls[0][0]).toEqual(['fake_transaction_1', 'fake_transaction_2']);
    });

    test('should get transactions for given address using specified params', async () => {
      const spies = spy();

      const address = '3N42b1qAmNLq1aJYACf8YQD4RUYBqL1qsmE';
      const res = await request(app.getHttpServer())
        .get(`/transactions/addresses/${address}`)
        .query({ limit: 10, offset: 5, type: 'anchor' })
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.header['x-total']).toBe('2');
      expect(res.body).toEqual([{ id: 'fake_transaction_1' }, { id: 'fake_transaction_2' }]);

      expect(spies.node.getTransactionsByAddress.mock.calls.length).toBe(1);
      expect(spies.node.getTransactionsByAddress.mock.calls[0][0]).toBe(address);
      expect(spies.node.getTransactionsByAddress.mock.calls[0][1]).toBe('anchor');
      expect(spies.node.getTransactionsByAddress.mock.calls[0][2]).toBe(10);
      expect(spies.node.getTransactionsByAddress.mock.calls[0][3]).toBe(5);
      expect(spies.node.getTransactionsByAddress.mock.calls.length).toBe(1);

      expect(spies.node.countTransactionsByAddress.mock.calls.length).toBe(1);
      expect(spies.node.countTransactionsByAddress.mock.calls[0][0]).toBe(address);

      expect(spies.node.getTransactions.mock.calls.length).toBe(1);
      expect(spies.node.getTransactions.mock.calls[0][0]).toEqual(['fake_transaction_1', 'fake_transaction_2']);
    });
  });

  describe('GET /transactions/stats/:type/:from/:to', () => {
    test('should get stats using timestamps', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get(`/transactions/stats/all/1614597904336/1614793341900`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual([
        { period: '2021-03-01 00:00:00', count: 56847 },
        { period: '2021-03-02 00:00:00', count: 103698 },
        { period: '2021-03-03 00:00:00', count: 33329 },
      ]);

      expect(spies.tx.getStats.mock.calls.length).toBe(1);
      expect(spies.tx.getStats.mock.calls[0][0]).toBe('all');
      expect(spies.tx.getStats.mock.calls[0][1]).toBe(18687);
      expect(spies.tx.getStats.mock.calls[0][2]).toBe(18689);
    });

    test('should get stats using date strings', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get(`/transactions/stats/all/2021-03-01/2021-03-03`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual([
        { period: '2021-03-01 00:00:00', count: 56847 },
        { period: '2021-03-02 00:00:00', count: 103698 },
        { period: '2021-03-03 00:00:00', count: 33329 },
      ]);

      expect(spies.tx.getStats.mock.calls.length).toBe(1);
      expect(spies.tx.getStats.mock.calls[0][0]).toBe('all');
      expect(spies.tx.getStats.mock.calls[0][1]).toBe(18687);
      expect(spies.tx.getStats.mock.calls[0][2]).toBe(18689);
    });
  });
});
