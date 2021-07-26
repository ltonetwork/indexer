import { Test, TestingModule } from '@nestjs/testing';
import { OperationStatsModuleConfig } from './operation-stats.module';
import { OperationStatsService } from './operation-stats.service';
import { TransactionService } from '../transaction/transaction.service';
import { AnchorService } from '../anchor/anchor.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { StorageService } from '../storage/storage.service';
import { LoggerService } from '../logger/logger.service';

describe('OperationStatsService', () => {
  let module: TestingModule;
  let transaction: Transaction;
  let anchorService: AnchorService;
  let loggerService: LoggerService;
  let storageService: StorageService;
  let transactionService: TransactionService;
  let operationStatsService: OperationStatsService;

  function spy() {
    const anchor = {
      getAnchorHashes: jest.spyOn(anchorService, 'getAnchorHashes').mockImplementation(() => ['hash_1', 'hash_2'])
    };

    const transaction = {
      getIdentifiersByType: jest.spyOn(transactionService, 'getIdentifiersByType').mockImplementation(() => ['all', 'transaction'])
    };

    const storage = {
      incrOperationStats: jest.spyOn(storageService, 'incrOperationStats').mockImplementation(async () => {}),
      getOperationStats: jest.spyOn(storageService, 'getOperationStats').mockImplementation(async () => '200'),
    };

    const logger = {
      debug: jest.spyOn(loggerService, 'debug').mockImplementation(() => {}),
    };

    return { anchor, transaction, storage, logger };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(OperationStatsModuleConfig).compile();
    await module.init();

    anchorService = module.get<AnchorService>(AnchorService);
    loggerService = module.get<LoggerService>(LoggerService);
    storageService = module.get<StorageService>(StorageService);
    transactionService = module.get<TransactionService>(TransactionService);
    operationStatsService = module.get<OperationStatsService>(OperationStatsService);

    transaction = {
      type: 1,
      id: 'fake_transaction',
      transfers: [{
        recipient: 'some_recipient',
      }, {
        recipient: 'some_recipient_2',
      }, {
        recipient: 'some_recipient_3',
      }],
    } as Transaction;
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should increase stats based on transfer count', async () => {
      const spies = spy();

      await operationStatsService.index({transaction, blockHeight: 1, position: 0});

      expect(spies.anchor.getAnchorHashes.mock.calls.length).toBe(0);
      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(3);
      expect(spies.transaction.getIdentifiersByType.mock.calls.length).toBe(1);

      expect(spies.logger.debug.mock.calls.length).toBe(1);
      expect(spies.logger.debug.mock.calls[0][0]).toBe(`operation stats: 3 transfers: increase stats: ${transaction.id}`);
    });

    test('should increase stats once if transaction has no transfer count', async () => {
      const spies = spy();

      // @ts-ignore (transfers is readonly)
      transaction.transfers = [];

      await operationStatsService.index({transaction, blockHeight: 1, position: 0});

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);

      expect(spies.logger.debug.mock.calls.length).toBe(1);
      expect(spies.logger.debug.mock.calls[0][0]).toBe(`operation stats: 1 transfers: increase stats: ${transaction.id}`);
    });

    describe('anchor transactions', () => {
      test('should increase stats based on the anchor hashes', async () => {
        const spies = spy();

        spies.transaction.getIdentifiersByType.mockImplementation(() => ['anchor', 'all']);

        await operationStatsService.index({transaction, blockHeight: 1, position: 0});

        expect(spies.anchor.getAnchorHashes.mock.calls.length).toBe(1);
        expect(spies.storage.incrOperationStats.mock.calls.length).toBe(2);
        expect(spies.transaction.getIdentifiersByType.mock.calls.length).toBe(1);

        expect(spies.logger.debug.mock.calls.length).toBe(1);
        expect(spies.logger.debug.mock.calls[0][0]).toBe(`operation stats: 2 anchors: increase stats: ${transaction.id}`);
      });
    });
  });

  describe('getOperationStats()', () => {
    test('should return the operation stats from storage', async () => {
      const spies = spy();

      const result = await operationStatsService.getOperationStats();

      expect(spies.storage.getOperationStats.mock.calls.length).toBe(1);
      expect(result).toBe('200');
    });
  });

  describe('incrOperationStats()', () => {
    test('should increase operation stats on storage', async () => {
      const spies = spy();

      await operationStatsService.incrOperationStats();

      expect(spies.storage.incrOperationStats.mock.calls.length).toBe(1);
    });
  });
});
