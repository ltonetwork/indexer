import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorService } from './anchor.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';

describe('AnchorService', () => {
  let module: TestingModule;
  let anchorService: AnchorService;
  let storageService: StorageService;

  function spy() {
    const storage = {
      saveAnchor: jest.spyOn(storageService, 'saveAnchor').mockImplementation(async () => { }),
      getRolesFor: jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => { return {} }),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    anchorService = module.get<AnchorService>(AnchorService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should process (old) data transactions', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 12,
        data: [
          {
            key: anchorService.anchorToken,
            value: 'base64:LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg',
          },
          {
            key: 'invalid key',
            value: 'base64:LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywga',
          },
        ],
      } as Transaction;

      await anchorService.index({transaction, blockHeight: 1, position: 0}, 'all');

      expect(spies.storage.getRolesFor.mock.calls.length).toBe(0);
      expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.saveAnchor.mock.calls[0][0])
        .toBe('2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08');
      expect(spies.storage.saveAnchor.mock.calls[0][1])
        .toMatchObject({ id: 'fake_transaction', blockHeight: 1, position: 0 });
    });

    test('should process anchor transactions', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 15,
        anchors: [
          '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
        ],
      } as Transaction;

      await anchorService.index({transaction, blockHeight: 1, position: 0}, 'all');

      expect(spies.storage.getRolesFor.mock.calls.length).toBe(0);
      expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.saveAnchor.mock.calls[0][0])
        .toBe('2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08');
      expect(spies.storage.saveAnchor.mock.calls[0][1])
        .toMatchObject({ id: 'fake_transaction', blockHeight: 1, position: 0 });
    });

    test('should process "trust" anchor if sender is trusted', async () => {
      const spies = spy();

      spies.storage.getRolesFor = jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => {
        return { root: { description: 'The root role' } };
      });

      const transaction = {
        id: 'fake_transaction',
        type: 15,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        anchors: [
          '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
        ],
      } as Transaction;

      await anchorService.index({transaction, blockHeight: 1, position: 0}, 'trust');

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.storage.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
    });

    test('should not process "trust" anchors if sender is not trusted', async () => {
      const spies = spy();

      spies.storage.getRolesFor = jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => { return {} });

      const transaction = {
        id: 'fake_transaction',
        type: 15,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        anchors: [
          '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
        ],
      } as Transaction;

      await anchorService.index({transaction, blockHeight: 1, position: 0}, 'trust');

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(0);
      expect(spies.storage.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.storage.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
    });
  });

  describe('getAnchorHahes()', () => {
    test('should return hashes for (old) data transactions', () => {
      const transaction = {
        id: 'fake_transaction',
        type: 12,
        data: [
          {
            key: anchorService.anchorToken,
            value: 'base64:LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywg',
          },
          {
            key: 'invalid key',
            value: 'base64:LGeJmzGkBiCwdgA1cgqcq9f0FMbaPbVhRhseSP4mywga',
          },
        ],
      } as Transaction;

      const hashes = anchorService.getAnchorHashes(transaction);

      expect(hashes).toEqual(['2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08']);
    });

    test('should return hashes for anchor transactions', () => {
      const transaction = {
        id: 'fake_transaction',
        type: 15,
        anchors: [
          '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
        ],
      } as Transaction;

      const hashes = anchorService.getAnchorHashes(transaction);

      expect(hashes).toEqual(['2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08']);
    });
  });
});
