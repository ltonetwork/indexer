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
        { id: 'transfer', types: [4] },
        { id: 'mass_transfer', types: [11] },
        { id: 'start_lease', types: [8] },
        { id: 'cancel_lease', types: [9] },
      ]);
    });
  });

  describe('getIdentifiers()', () => {
    test('get identifiers of all transaction types', async () => {
      expect(transactionService.getIdentifiers())
        .toEqual(['anchor', 'transfer', 'mass_transfer', 'start_lease', 'cancel_lease']);
    });
  });

  describe('getIdentifierByType()', () => {
    test('get identifier by type', async () => {
      expect(transactionService.getIdentifierByType(4)).toBe('transfer');
      expect(transactionService.getIdentifierByType(8)).toBe('start_lease');
      expect(transactionService.getIdentifierByType(9)).toBe('cancel_lease');
      expect(transactionService.getIdentifierByType(11)).toBe('mass_transfer');
      expect(transactionService.getIdentifierByType(12)).toBe('anchor');
      expect(transactionService.getIdentifierByType(15)).toBe('anchor');
      expect(transactionService.getIdentifierByType(99)).toBe(null);
    });
  });

  describe('hasIdentifier()', () => {
    test('check if transaction type with identifier exists', async () => {
      expect(transactionService.hasIdentifier('anchor')).toBe(true);
      expect(transactionService.hasIdentifier('transfer')).toBe(true);
      expect(transactionService.hasIdentifier('mass_transfer')).toBe(true);
      expect(transactionService.hasIdentifier('start_lease')).toBe(true);
      expect(transactionService.hasIdentifier('cancel_lease')).toBe(true);
      expect(transactionService.hasIdentifier('foo')).toBe(false);
    });
  });
});
