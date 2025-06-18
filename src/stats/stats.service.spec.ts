import { Test, TestingModule } from '@nestjs/testing';
import { StatsModuleConfig } from './stats.module';
import { Transaction } from '../interfaces/transaction.interface';

import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';
import { StorageService } from '../storage/storage.service';
import { Block } from '../interfaces/block.interface';
import { NodeService } from '../node/node.service';

describe('StatsService', () => {
  let module: TestingModule;
  let block: Block;

  let statsService: StatsService;
  let supplyService: SupplyService;
  let storageService: StorageService;
  let nodeService: NodeService;

  function spy() {
    const storage = {
      incrTxStats: jest.spyOn(storageService, 'incrTxStats').mockResolvedValue(undefined),
      incrOperationStats: jest.spyOn(storageService, 'incrOperationStats').mockResolvedValue(undefined),
      incrLeaseStats: jest.spyOn(storageService, 'incrLeaseStats').mockResolvedValue(undefined),
    };

    const supply = {
      incrTxFeeBurned: jest.spyOn(supplyService, 'incrTxFeeBurned').mockResolvedValue(undefined),
    };

    const node = {
      getTransaction: jest.spyOn(nodeService, 'getTransaction').mockImplementation(
        async () =>
          ({
            id: 'fake_current_lease',
            type: 8,
            amount: 1234,
          } as Transaction),
      ),
    };

    return { storage, supply, node };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StatsModuleConfig).compile();
    await module.init();

    statsService = module.get<StatsService>(StatsService);
    supplyService = module.get<SupplyService>(SupplyService);
    storageService = module.get<StorageService>(StorageService);
    nodeService = module.get<NodeService>(NodeService);

    statsService.configure({
      operations: true,
      transactions: true,
      supply: true,
      lease: true,
      //generators: true,
    });

    block = {
      height: 100,
      timestamp: 1664285601000,
      transactions: [
        { type: 4, id: 'fake_transfer' } as Transaction,
        { type: 11, id: 'fake_mass_transfer', transfers: [{}, {}, {}] } as Transaction,
        { type: 15, id: 'fake_anchor_1', anchors: ['', ''] } as Transaction,
        { type: 15, id: 'fake_anchor_2', anchors: [''] } as Transaction,
        { type: 8, id: 'fake_lease', amount: 4321 } as Transaction,
        { type: 9, id: 'fake_cancel_lease', leaseId: 'fake_current_lease' } as Transaction,
      ],
      transactionCount: 6,
      generator: '2f',
      generatorReward: 4200,
      burnedFees: 175,
    } as Block;
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should check for each stat config and call the appropriate service', async () => {
      const spies = spy();

      await statsService.index(block);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrOperationStats.mock.calls[0]).toEqual([19262, 9]);

      expect(spies.storage.incrTxStats.mock.calls.length).toBe(6);
      expect(spies.storage.incrTxStats.mock.calls[0]).toEqual(['all', 19262, 6]);
      expect(spies.storage.incrTxStats.mock.calls[1]).toEqual(['anchor', 19262, 2]);
      expect(spies.storage.incrTxStats.mock.calls[2]).toEqual(['transfer', 19262, 1]);
      expect(spies.storage.incrTxStats.mock.calls[3]).toEqual(['mass_transfer', 19262, 1]);
      expect(spies.storage.incrTxStats.mock.calls[4]).toEqual(['all_transfers', 19262, 2]);
      expect(spies.storage.incrTxStats.mock.calls[5]).toEqual(['lease', 19262, 2]);

      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
      expect(spies.supply.incrTxFeeBurned.mock.calls[0][0]).toBe(175);

      expect(spies.node.getTransaction.mock.calls.length).toBe(1);
      expect(spies.node.getTransaction.mock.calls[0][0]).toBe('fake_current_lease');
      expect(spies.storage.incrLeaseStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrLeaseStats.mock.calls[0]).toEqual([19262, 4321, 1234]);
    });

    test('should skip "operations" stats if config is set', async () => {
      const spies = spy();

      statsService.configure({ operations: false });

      await statsService.index(block);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(0);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(6);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
      expect(spies.storage.incrLeaseStats.mock.calls.length).toBe(1);
    });

    test('should skip "transactions" stats if config is set', async () => {
      const spies = spy();

      statsService.configure({ transactions: false });

      await statsService.index(block);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(0);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
      expect(spies.storage.incrLeaseStats.mock.calls.length).toBe(1);
    });

    test('should skip "supply" stats if config is set', async () => {
      const spies = spy();

      statsService.configure({ supply: false });

      await statsService.index(block);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(6);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(0);
      expect(spies.storage.incrLeaseStats.mock.calls.length).toBe(1);
    });

    test('should skip "lease" stats if config is set', async () => {
      const spies = spy();

      statsService.configure({ lease: false });

      await statsService.index(block);

      expect(spies.node.getTransaction.mock.calls.length).toBe(0);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(6);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
      expect(spies.storage.incrLeaseStats.mock.calls.length).toBe(0);
    });
  });
});
