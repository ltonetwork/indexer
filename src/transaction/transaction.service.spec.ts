import { Test, TestingModule } from '@nestjs/testing';
import { TransactionModuleConfig } from './transaction.module';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let module: TestingModule;
  let transactionService: TransactionService;

  beforeEach(async () => {
    module = await Test.createTestingModule(TransactionModuleConfig).compile();
    await module.init();

    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getAllTypes()', () => {
    test('get all transaction types', async () => {
      expect(transactionService.getAllTypes()).toEqual([
        { id: 'anchor', types: [12, 15] },
        { id: 'transfer', types: [4, 11] },
      ]);
    });
  });

  describe('getIdentifiers()', () => {
    test('get identifiers of all transaction types', async () => {
      expect(transactionService.getIdentifiers()).toEqual(['anchor', 'transfer']);
    });
  });

  describe('getIdentifierByType()', () => {
    test('get identifier by type', async () => {
      expect(transactionService.getIdentifierByType(12)).toBe('anchor');
      expect(transactionService.getIdentifierByType(15)).toBe('anchor');
      expect(transactionService.getIdentifierByType(4)).toBe('transfer');
      expect(transactionService.getIdentifierByType(11)).toBe('transfer');
      expect(transactionService.getIdentifierByType(99)).toBe(null);
    });
  });

  describe('hasIdentifier()', () => {
    test('check if transaction type with identifier exists', async () => {
      expect(transactionService.hasIdentifier('anchor')).toBe(true);
      expect(transactionService.hasIdentifier('transfer')).toBe(true);
      expect(transactionService.hasIdentifier('foo')).toBe(false);
    });
  });
});
