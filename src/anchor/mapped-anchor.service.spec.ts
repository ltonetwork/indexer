import { Test, TestingModule } from '@nestjs/testing';
import { AnchorModuleConfig } from './anchor.module';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { TrustNetworkService } from '../trust-network/trust-network.service';
import { MappedAnchorService } from './mapped-anchor.service';

describe('MappedAnchorService', () => {
  let module: TestingModule;
  let service: MappedAnchorService;
  let storageService: StorageService;
  let trustService: TrustNetworkService;

  function spy() {
    const storage = {
      saveMappedAnchor: jest.spyOn(storageService, 'saveMappedAnchor').mockImplementation(async () => {}),
      getRolesFor: jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => {
        return {};
      }),
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

    service = module.get<MappedAnchorService>(MappedAnchorService);
    storageService = module.get<StorageService>(StorageService);
    trustService = module.get<TrustNetworkService>(TrustNetworkService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
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

      expect(spies.storage.getRolesFor.mock.calls.length).toBe(0);
      expect(spies.storage.saveMappedAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.saveMappedAnchor.mock.calls[0][0]).toBe(
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
      expect(spies.storage.saveMappedAnchor.mock.calls[0][1]).toMatchObject({
        anchor: '2c67899b31a40620b0760035720a9cabd7f414c6da3db561461b1e48fe26cb08',
        id: 'fake_transaction',
        blockHeight: 1,
        position: 0,
      });
    });

    test('should process "trust" anchor if sender is trusted', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 22,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        anchors: {
          GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn: '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
        },
      } as unknown as Transaction;

      await service.index({ transaction, blockHeight: 1, position: 0 }, 'trust');

      expect(spies.storage.saveMappedAnchor.mock.calls.length).toBe(1);

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
        type: 22,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        anchors: {
          GKot5hBsd81kMupNCXHaqbhv3huEbxAFMLnpcX2hniwn: '3zLWTHPNkmDsCRi2kZqFXFSBnTYykz13gHLezU4p6zmu',
        },
      } as unknown as Transaction;

      await service.index({ transaction, blockHeight: 1, position: 0 }, 'trust');

      expect(spies.storage.saveMappedAnchor.mock.calls.length).toBe(0);

      expect(spies.trust.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.trust.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
    });
  });
});
