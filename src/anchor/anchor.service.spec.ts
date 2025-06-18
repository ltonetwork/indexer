import type { Transaction } from '../interfaces/transaction.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorService } from './anchor.service';
import { StorageService } from '../storage/storage.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';

describe('AnchorService', () => {
  let module: TestingModule;
  let service: AnchorService;
  let storageService: StorageService;
  let trustService: TrustNetworkService;

  function spy() {
    const storage = {
      saveAnchor: jest.spyOn(storageService, 'saveAnchor').mockResolvedValue(undefined),
    };

    const trust = {
      getRolesFor: jest.spyOn(trustService, 'getRolesFor').mockImplementation(async () => {
        return { roles: ['root'], issues_authorization: [], issues_roles: [] };
      }),
    };

    return { storage, trust };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    service = module.get<AnchorService>(AnchorService);
    storageService = module.get<StorageService>(StorageService);
    trustService = module.get<TrustNetworkService>(TrustNetworkService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should process anchor transactions', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 15,
        anchors: ['3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu'],
      } as Transaction;

      await service.index({ transaction, blockHeight: 1, position: 0 }, 'all');

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.saveAnchor.mock.calls[0][0]).toBe(
        '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08',
      );
      expect(spies.storage.saveAnchor.mock.calls[0][1]).toMatchObject({
        id: 'fake_transaction',
        blockHeight: 1,
        position: 0,
      });
    });

    test('should process mapped-anchor transactions', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 22,
        anchors: {
          GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn: '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
        },
      } as unknown as Transaction;

      await service.index({ transaction, blockHeight: 1, position: 0 }, 'all');

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.saveAnchor.mock.calls[0][0]).toBe(
        '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08',
      );
      expect(spies.storage.saveAnchor.mock.calls[0][1]).toMatchObject({
        id: 'fake_transaction',
        blockHeight: 1,
        position: 0,
      });
    });

    test('should not process other transaction types', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 1,
      } as Transaction;

      await service.index({ transaction, blockHeight: 1, position: 0 }, 'all');

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(0);
    });

    test('should process "trust" anchor if sender is trusted', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 15,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        anchors: ['3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu'],
      } as Transaction;

      await service.index({ transaction, blockHeight: 1, position: 0 }, 'trust');

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(1);

      expect(spies.trust.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.trust.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
    });

    test('should not process "trust" anchors if sender is not trusted', async () => {
      const spies = spy();

      spies.trust.getRolesFor = jest.spyOn(trustService, 'getRolesFor').mockImplementation(async () => {
        return {
          roles: [],
          issues_authorization: [],
          issues_roles: [],
        };
      });

      const transaction = {
        id: 'fake_transaction',
        type: 15,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        anchors: ['3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu'],
      } as Transaction;

      await service.index({ transaction, blockHeight: 1, position: 0 }, 'trust');

      expect(spies.storage.saveAnchor.mock.calls.length).toBe(0);

      expect(spies.trust.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.trust.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
    });
  });
});
