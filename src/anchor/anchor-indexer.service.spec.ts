import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorIndexerService } from './anchor-indexer.service';
import { StorageService } from '../storage/storage.service';

describe('AnchorIndexService', () => {
  let module: TestingModule;
  let indexerService: AnchorIndexerService;
  let storageService: StorageService;

  function spy() {
    const indexer = {
      index: jest.spyOn(indexerService, 'index'),
    };
    const storage = {
      indexTx: jest.spyOn(storageService, 'indexTx')
        .mockImplementation(),
    };

    return { indexer, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    indexerService = module.get<AnchorIndexerService>(AnchorIndexerService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should ignore genesis transactions', async () => {
      const spies = spy();

      const type = 'anchor';
      const transaction = { id: 'fake_transaction', type: 1, sender: 'fake_sender' };
      await indexerService.index(transaction as any, 1);

      expect(spies.storage.indexTx.mock.calls.length).toBe(0);
    });

    test('should index the anchor transaction', async () => {
      const spies = spy();

      const type = 'anchor';
      const transaction = { id: 'fake_transaction', type: 12, sender: 'fake_sender' };
      await indexerService.index(transaction as any, 1);

      expect(spies.storage.indexTx.mock.calls.length).toBe(1);
      expect(spies.storage.indexTx.mock.calls[0][0]).toBe(type);
      expect(spies.storage.indexTx.mock.calls[0][1]).toBe(transaction.sender);
      expect(spies.storage.indexTx.mock.calls[0][2]).toBe(transaction.id);
    });

    test('should index the transfer transaction', async () => {
      const spies = spy();

      const type = 'transfer';
      const transaction = {
        id: 'fake_transaction',
        type: 4,
        sender: 'fake_sender',
        recipient: 'fake_recipient',
      };
      await indexerService.index(transaction as any, 1);

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
      await indexerService.index(transaction as any, 1);

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
