import { Test, TestingModule } from '@nestjs/testing';
import { StatsModuleConfig } from './stats.module';
import { Transaction } from '../transaction/interfaces/transaction.interface';

import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { OperationsService } from './operations/operations.service';
import { TransactionService } from '../transaction/transaction.service';

describe('StatsService', () => {
  let module: TestingModule;
  let transaction: Transaction;

  let statsService: StatsService;
  let supplyService: SupplyService;
  let configService: ConfigService;
  let storageService: StorageService;
  let operationsService: OperationsService;
  let transactionService: TransactionService;

  function spy() {
    const storage = {
      incrTxStats: jest.spyOn(storageService, 'incrTxStats').mockImplementation(async () => {}),
    };

    const config = {
      isStatsEnabled: jest.spyOn(configService, 'isStatsEnabled').mockImplementation(() => true),
    };

    const supply = {
      incrTxFeeBurned: jest.spyOn(supplyService, 'incrTxFeeBurned').mockImplementation(async () => {}),
    };

    const operations = {
      incrOperationStats: jest.spyOn(operationsService, 'incrOperationStats').mockImplementation()
    };

    const transaction = {
      getIdentifiersByType: jest.spyOn(transactionService, 'getIdentifiersByType').mockImplementation(() => ['transaction'])
    };

    return { transaction, storage, config, operations, supply };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StatsModuleConfig).compile();
    await module.init();

    statsService = module.get<StatsService>(StatsService);
    supplyService = module.get<SupplyService>(SupplyService);
    configService = module.get<ConfigService>(ConfigService);
    storageService = module.get<StorageService>(StorageService);
    operationsService = module.get<OperationsService>(OperationsService);
    transactionService = module.get<TransactionService>(TransactionService);

    transaction = {
      type: 1,
      id: 'fake_transaction',
    } as Transaction;
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should check for each stat config and call the appropriate service', async () => {
      const spies = spy();

      await statsService.index({transaction, blockHeight: 1, position: 0});

      expect(spies.transaction.getIdentifiersByType.mock.calls.length).toBe(1);
      expect(spies.config.isStatsEnabled.mock.calls.length).toBe(3);

      expect(spies.operations.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(1);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
    });

    test('should skip "operations" stats if config is set', async () => {
      const spies = spy();

      spies.config.isStatsEnabled.mockImplementation((token: string) => {
        if (token === 'operations') return false;

        return true;
      });

      await statsService.index({transaction, blockHeight: 1, position: 0});

      expect(spies.operations.incrOperationStats.mock.calls.length).toBe(0);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(1);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
    });

    test('should skip "transactions" stats if config is set', async () => {
      const spies = spy();

      spies.config.isStatsEnabled.mockImplementation((token: string) => {
        if (token === 'transactions') return false;

        return true;
      });

      await statsService.index({transaction, blockHeight: 1, position: 0});

      expect(spies.operations.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(0);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(1);
    });

    test('should skip "supply" stats if config is set', async () => {
      const spies = spy();

      spies.config.isStatsEnabled.mockImplementation((token: string) => {
        if (token === 'supply') return false;

        return true;
      });

      await statsService.index({transaction, blockHeight: 1, position: 0});

      expect(spies.operations.incrOperationStats.mock.calls.length).toBe(1);
      expect(spies.storage.incrTxStats.mock.calls.length).toBe(1);
      expect(spies.supply.incrTxFeeBurned.mock.calls.length).toBe(0);
    });
  });
});
