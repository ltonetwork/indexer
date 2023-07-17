import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TransactionModuleConfig } from './transaction.module';
import { NodeService } from '../node/node.service';

describe('TransactionController', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let app: INestApplication;

  function spy() {
    const node = {
      getTransactionsByAddress: jest
        .spyOn(nodeService, 'getTransactionsByAddress')
        .mockResolvedValue(['fake_transaction_1', 'fake_transaction_2']),
      countTransactionsByAddress: jest.spyOn(nodeService, 'countTransactionsByAddress').mockResolvedValue(2),
      getTransactions: jest
        .spyOn(nodeService, 'getTransactions')
        .mockResolvedValue([{ id: 'fake_transaction_1' }, { id: 'fake_transaction_2' }] as any),
    };

    return { node };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TransactionModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    nodeService = module.get<NodeService>(NodeService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /transactions/addresses/:address', () => {
    test('should get transactions for given address using default params', async () => {
      const spies = spy();

      const address = '3N42b1qAmNLq1aJYACf8YQD4RUYBqL1qsmE';
      const res = await request(app.getHttpServer()).get(`/transactions/addresses/${address}`).send();

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
});
