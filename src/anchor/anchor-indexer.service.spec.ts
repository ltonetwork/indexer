import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorStorageService } from './anchor-storage.service';
import { AnchorIndexerService } from './anchor-indexer.service';

describe('AnchorService', () => {
  let module: TestingModule;
  let indexerService: AnchorIndexerService;
  let storageService: AnchorStorageService;

  function spy() {
    const indexer = {
      index: jest.spyOn(indexerService, 'index'),
      indexAnchorTx: jest.spyOn(indexerService, 'indexAnchorTx'),
      indexTransferTx: jest.spyOn(indexerService, 'indexTransferTx'),
    };
    const storage = {
      indexAnchorTx: jest.spyOn(storageService, 'indexAnchorTx')
        .mockImplementation(),
      indexTransferTx: jest.spyOn(storageService, 'indexTransferTx')
        .mockImplementation(),
    };

    return { indexer, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    indexerService = module.get<AnchorIndexerService>(AnchorIndexerService);
    storageService = module.get<AnchorStorageService>(AnchorStorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should index the anchor transaction', async () => {
      const spies = spy();
      spies.indexer.indexAnchorTx.mockImplementation();

      const transaction = { id: 'fake_transaction', sender: 'fake_sender', type: 12 };
      await indexerService.index(transaction as any);

      expect(spies.indexer.indexAnchorTx.mock.calls.length).toBe(1);
      expect(spies.indexer.indexAnchorTx.mock.calls[0][0]).toBe(transaction);
    });

    test('should index the transfer transaction', async () => {
      const spies = spy();
      spies.indexer.indexTransferTx.mockImplementation();

      const transaction = { id: 'fake_transaction', sender: 'fake_sender', type: 4 };
      await indexerService.index(transaction as any);

      expect(spies.indexer.indexTransferTx.mock.calls.length).toBe(1);
      expect(spies.indexer.indexTransferTx.mock.calls[0][0]).toBe(transaction);
    });
  });

  describe('indexAnchorTx()', () => {
    test('should index the anchor transaction', async () => {
      const spies = spy();

      const transaction = { id: 'fake_transaction', sender: 'fake_sender' };
      await indexerService.indexAnchorTx(transaction as any);

      expect(spies.storage.indexAnchorTx.mock.calls.length).toBe(1);
      expect(spies.storage.indexAnchorTx.mock.calls[0][0]).toBe(transaction.sender);
      expect(spies.storage.indexAnchorTx.mock.calls[0][1]).toBe(transaction.id);
    });
  });

  describe('indexTransferTx()', () => {
    test('should index the transfer transaction', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        sender: 'fake_sender',
        recipient: 'fake_recipient',
        transfers: [
          { recipient: 'fake_transfer_1' },
          { recipient: 'fake_transfer_2' },
        ],
      };
      await indexerService.indexTransferTx(transaction as any);

      expect(spies.storage.indexTransferTx.mock.calls.length).toBe(4);
      expect(spies.storage.indexTransferTx.mock.calls[0][0]).toBe(transaction.sender);
      expect(spies.storage.indexTransferTx.mock.calls[0][1]).toBe(transaction.id);
      expect(spies.storage.indexTransferTx.mock.calls[1][0]).toBe(transaction.recipient);
      expect(spies.storage.indexTransferTx.mock.calls[1][1]).toBe(transaction.id);
      expect(spies.storage.indexTransferTx.mock.calls[2][0]).toBe(transaction.transfers[0].recipient);
      expect(spies.storage.indexTransferTx.mock.calls[2][1]).toBe(transaction.id);
      expect(spies.storage.indexTransferTx.mock.calls[3][0]).toBe(transaction.transfers[1].recipient);
      expect(spies.storage.indexTransferTx.mock.calls[3][1]).toBe(transaction.id);
    });
  });
});
