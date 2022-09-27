import { Test, TestingModule } from '@nestjs/testing';
import { StatsModuleConfig } from './stats.module';
import { Transaction } from '../transaction/interfaces/transaction.interface';

import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { TransactionService } from '../transaction/transaction.service';
import { Block } from '../transaction/interfaces/block.interface';

describe('StatsService', () => {
  let module: TestingModule;
  let block: Block;

  let statsService: StatsService;
  let supplyService: SupplyService;
  let storageService: StorageService;
  let transactionService: TransactionService;

  function spy() {
    const storage = {
      incrTxStats: jest.spyOn(storageService, 'incrTxStats').mockImplementation(async () => {}),
      incrOperationStats: jest.spyOn(storageService, 'incrOperationStats').mockImplementation(async () => {}),
    };

    const supply = {
      incrTxFeeBurned: jest.spyOn(supplyService, 'incrTxFeeBurned').mockImplementation(async () => {}),
    };

    return { storage, supply };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StatsModuleConfig).compile();
    await module.init();

    statsService = module.get<StatsService>(StatsService);
    supplyService = module.get<SupplyService>(SupplyService);
    storageService = module.get<StorageService>(StorageService);
    transactionService = module.get<TransactionService>(TransactionService);

    statsService.configure(true, true, true);

    block = {
      height: 100,
      timestamp: 1664285601000,
      transactions: [
        { type: 4, id: 'fake_transfer' } as Transaction,
        { type: 11, id: 'fake_mass_transfer', transfers: [{}, {}, {}] } as Transaction,
        { type: 15, id: 'fake_anchor_1', anchors: ['', ''] } as Transaction,
        { type: 15, id: 'fake_anchor_2', anchors: [''] } as Transaction,
      ],
      transactionCount: 4,
      generator: '2f',
      burnedFees: 1.55,
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
      expect(spies.storage.incrOperationStats.mock.calls[0]).toEqual([19262, 7]);

      expect(spies.storage.incrTxStats.mock.calls.length).toBe(5);
      expect(spies.storage.incrTxStats.mock.calls[0]).toEqual(['all', 19262, 4]);
      expect(spies.storage.incrTxStats.mock.calls[1]).toEqual(['anchor', 19262, 2]);
      expect(spies.storage.incrTxStats.mock.calls[2]).toEqual(['transfer', 19262, 1]);
      expect(spies.storage.incrTxStats.mock.calls[3]).toEqual(['mass_transfer', 19262, 1]);
      expect(spies.storage.incrTxStats.mock.calls[4]).toEqual(['all_transfers', 19262, 2]);

      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
      expect(spies.supply.incrTxFeeBurned.mock.calls[0][0]).toBe(1.55);
    });

    test('should skip "operations" stats if config is set', async () => {
      const spies = spy();

      statsService.configure(false, true, true);

      await statsService.index(block);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(0);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(5);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
    });

    test('should skip "transactions" stats if config is set', async () => {
      const spies = spy();

      statsService.configure(true, false, true);

      await statsService.index(block);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(0);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
    });

    test('should skip "supply" stats if config is set', async () => {
      const spies = spy();

      statsService.configure(true, true, false);

      await statsService.index(block);

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(5);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(0);
    });
  });
});
