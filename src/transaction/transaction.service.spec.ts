import { Test, TestingModule } from '@nestjs/testing';
import { TransactionModuleConfig } from './transaction.module';
import { TransactionService } from './transaction.service';
import { StorageService } from '../storage/storage.service';

describe('TransactionService', () => {
  let module: TestingModule;
  let transactionService: TransactionService;
  let storageService: StorageService;

  function spy() {
    const storage = {
      indexTx: jest.spyOn(storageService, 'indexTx').mockImplementation(() => { }),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TransactionModuleConfig).compile();
    await module.init();

    transactionService = module.get<TransactionService>(TransactionService);
    storageService = module.get<StorageService>(StorageService);
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
        { id: 'all_transfers', types: [4, 11] },
      ]);
    });
  });

  describe('getIdentifiers()', () => {
    test('get identifiers of all transaction types', async () => {
      expect(transactionService.getIdentifiers())
        .toEqual(['anchor', 'transfer', 'mass_transfer', 'start_lease', 'cancel_lease', 'all_transfers']);
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
      expect(transactionService.hasIdentifier('all_transfers')).toBe(true);
      expect(transactionService.hasIdentifier('foo')).toBe(false);
    });
  });

  describe('index', () => {

    test('should index the transfer transaction', async () => {
      const spies = spy();

      const type = 'transfer';
      const transaction = {
        id: 'fake_transaction',
        type: 4,
        sender: 'fake_sender',
        recipient: 'fake_recipient',
      };

      await transactionService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.indexTx.mock.calls.length).toBe(4);
      expect(spies.storage.indexTx.mock.calls[0][0]).toBe(type);
      expect(spies.storage.indexTx.mock.calls[0][1]).toBe(transaction.sender);
      expect(spies.storage.indexTx.mock.calls[0][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[1][0]).toBe(type);
      expect(spies.storage.indexTx.mock.calls[1][1]).toBe(transaction.recipient);
      expect(spies.storage.indexTx.mock.calls[1][2]).toBe(transaction.id);

      expect(spies.storage.indexTx.mock.calls[2][0]).toBe('all_transfers');
      expect(spies.storage.indexTx.mock.calls[2][1]).toBe(transaction.sender);
      expect(spies.storage.indexTx.mock.calls[2][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[3][0]).toBe('all_transfers');
      expect(spies.storage.indexTx.mock.calls[3][1]).toBe(transaction.recipient);
      expect(spies.storage.indexTx.mock.calls[3][2]).toBe(transaction.id);
    });

    test('should index the mass transfer transaction', async () => {
      const spies = spy();

      const type = 'mass_transfer';
      const transaction = {
        id: 'fake_transaction',
        type: 11,
        sender: 'fake_sender',
        recipient: 'fake_recipient',
        transfers: [
          { recipient: 'fake_transfer_1' },
          { recipient: 'fake_transfer_2' },
        ],
      };

      await transactionService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.indexTx.mock.calls.length).toBe(8);
      expect(spies.storage.indexTx.mock.calls[0][0]).toBe(type);
      expect(spies.storage.indexTx.mock.calls[0][1]).toBe(transaction.sender);
      expect(spies.storage.indexTx.mock.calls[0][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[1][0]).toBe(type);
      expect(spies.storage.indexTx.mock.calls[1][1]).toBe(transaction.recipient);
      expect(spies.storage.indexTx.mock.calls[1][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[2][0]).toBe(type);
      expect(spies.storage.indexTx.mock.calls[2][1]).toBe(transaction.transfers[0].recipient);
      expect(spies.storage.indexTx.mock.calls[2][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[3][0]).toBe(type);
      expect(spies.storage.indexTx.mock.calls[3][1]).toBe(transaction.transfers[1].recipient);
      expect(spies.storage.indexTx.mock.calls[3][2]).toBe(transaction.id);

      expect(spies.storage.indexTx.mock.calls[4][0]).toBe('all_transfers');
      expect(spies.storage.indexTx.mock.calls[4][1]).toBe(transaction.sender);
      expect(spies.storage.indexTx.mock.calls[4][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[5][0]).toBe('all_transfers');
      expect(spies.storage.indexTx.mock.calls[5][1]).toBe(transaction.recipient);
      expect(spies.storage.indexTx.mock.calls[5][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[6][0]).toBe('all_transfers');
      expect(spies.storage.indexTx.mock.calls[6][1]).toBe(transaction.transfers[0].recipient);
      expect(spies.storage.indexTx.mock.calls[6][2]).toBe(transaction.id);
      expect(spies.storage.indexTx.mock.calls[7][0]).toBe('all_transfers');
      expect(spies.storage.indexTx.mock.calls[7][1]).toBe(transaction.transfers[1].recipient);
      expect(spies.storage.indexTx.mock.calls[7][2]).toBe(transaction.id);
    });
  });
});
