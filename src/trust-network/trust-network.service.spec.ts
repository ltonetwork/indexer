import { Test, TestingModule } from '@nestjs/testing';
import { TrustNetworkModuleConfig } from './trust-network.module';
import { TrustNetworkService } from './trust-network.service';
import { StorageService } from '../storage/storage.service';

describe('TrustNetworkService', () => {
  let module: TestingModule;

  let storageService: StorageService;
  let trustNetworkService: TrustNetworkService;

  let transaction: any;

  function spy() {
    const storage = {
      getTrustNetworkRoles: jest.spyOn(storageService, 'getTrustNetworkRoles').mockImplementation(async () => {
        return {
          roles: ['authority'],
          issues_roles: [{ type: 101, role: 'university' }],
          issues_authorization: [],
        }
      }),
      saveTrustNetworkRole: jest.spyOn(storageService, 'saveTrustNetworkRole').mockImplementation(async () => {}),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TrustNetworkModuleConfig).compile();
    await module.init();

    storageService = module.get<StorageService>(StorageService);
    trustNetworkService = module.get<TrustNetworkService>(TrustNetworkService);

    transaction = {
      id: 'fake_transaction',
      type: 1,
      sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
      associationType: 101,
    };
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index', () => {
    test('should index a role association', async () => {
      const spies = spy();

      const expectedRole = { type: 101, role: 'university' };

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveTrustNetworkRole.mock.calls.length).toBe(1);
      expect(spies.storage.saveTrustNetworkRole.mock.calls[0][0])
        .toBe(transaction.recipient);
      expect(spies.storage.saveTrustNetworkRole.mock.calls[0][1])
        .toBe(transaction.sender);
      expect(spies.storage.saveTrustNetworkRole.mock.calls[0][2])
        .toStrictEqual(expectedRole);
    });

    test('should index multiple roles of same type when configured', async () => {
      const spies = spy();
      const expectedRoles = [{ type: 101, role: 'authority' }, { type: 101, role: 'university' }];

      spies.storage.getTrustNetworkRoles = jest.spyOn(storageService, 'getTrustNetworkRoles').mockImplementation(async () => {
        return {
          roles: ['authority'],
          issues_roles: [...expectedRoles],
          issues_authorization: [],
        }
      });

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveTrustNetworkRole.mock.calls.length).toBe(2);
      expect(spies.storage.saveTrustNetworkRole.mock.calls[0][2])
        .toStrictEqual(expectedRoles[0]);
      expect(spies.storage.saveTrustNetworkRole.mock.calls[1][2])
        .toStrictEqual(expectedRoles[1]);
    });

    test('should skip indexing if there is no recipient', async () => {
      const spies = spy();

      delete transaction.recipient;

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveTrustNetworkRole.mock.calls.length).toBe(0);
    });

    test('should skip indexing if there is no association type', async () => {
      const spies = spy();

      delete transaction.associationType;

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveTrustNetworkRole.mock.calls.length).toBe(0);
    });
  });

  describe('getRolesFor()', () => {
    test('should return the roles from storage service', async () => {
      const spies = spy();

      await trustNetworkService.getRolesFor('mock-address');

      expect(spies.storage.getTrustNetworkRoles.mock.calls.length).toBe(1);
      expect(spies.storage.getTrustNetworkRoles.mock.calls[0][0])
        .toBe('mock-address');
    });
  });
});
