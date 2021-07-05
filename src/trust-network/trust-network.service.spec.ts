import { Test, TestingModule } from '@nestjs/testing';
import { TrustNetworkModuleConfig } from './trust-network.module';
import { TrustNetworkService } from './trust-network.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../config/config.service';
import { NodeService } from '../node/node.service';
import { RoleData } from './interfaces/trust-network.interface';

describe('TrustNetworkService', () => {
  let module: TestingModule;

  let nodeService: NodeService;
  let configService: ConfigService;
  let storageService: StorageService;
  let trustNetworkService: TrustNetworkService;

  let transaction: any;

  function spy() {
    const storage = {
      saveRoleAssociation: jest.spyOn(storageService, 'saveRoleAssociation').mockImplementation(async () => {}),
      getRolesFor: jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => {
        return {
          authority: { sender: 'mock-sender', type: 100 }
        }
      }),
    };

    const node = {
      getNodeWallet: jest.spyOn(nodeService, 'getNodeWallet').mockImplementation(async () => 'node-address'),
    };

    const config = {
      getRoles: jest.spyOn(configService, 'getRoles').mockImplementation(() => {
        return {
          root: {
            description: 'The root',
            issues: [{ type: 100, role: 'authority' }]
          },
          authority: {
            description: 'The authority',
            issues: [{ type: 100, role: 'university' }, { type: 101, role: 'sub_authority' }],
            authorization: ['https://www.w3.org/2018/credentials/examples/v1']
          },
          sub_authority: {
            description: 'The sub authority',
            issues: [{ type: 100, role: 'university' }]
          },
          university: {
            description: 'The university',
            authorization: ['https://www.w3.org/2018/credentials/examples/v1']
          }
        };
      }),
    };

    return { storage, node, config };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TrustNetworkModuleConfig).compile();

    nodeService = module.get<NodeService>(NodeService);
    configService = module.get<ConfigService>(ConfigService);
    storageService = module.get<StorageService>(StorageService);
    trustNetworkService = module.get<TrustNetworkService>(TrustNetworkService);

    transaction = {
      id: 'fake_transaction',
      type: 1,
      sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
      associationType: 101,
    };

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index', () => {
    test('should index a role association', async () => {
      const spies = spy();

      const expectedRole = { type: 101, role: 'sub_authority' };

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveRoleAssociation.mock.calls.length).toBe(1);
      expect(spies.storage.saveRoleAssociation.mock.calls[0][0])
        .toBe(transaction.recipient);
      expect(spies.storage.saveRoleAssociation.mock.calls[0][1])
        .toBe(transaction.sender);
      expect(spies.storage.saveRoleAssociation.mock.calls[0][2])
        .toStrictEqual(expectedRole);
    });

    test('should index multiple roles of same type when configured', async () => {
      const spies = spy();
      const expectedRoles = [{ type: 101, role: 'university' }, { type: 101, role: 'sub_authority' }];

      spies.config.getRoles = jest.spyOn(configService, 'getRoles').mockImplementation(() => {
        return {
          authority: {
            description: 'The authority',
            issues: expectedRoles,
            authorization: ['https://www.w3.org/2018/credentials/examples/v1']
          }
        };
      });

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveRoleAssociation.mock.calls.length).toBe(2);
      expect(spies.storage.saveRoleAssociation.mock.calls[0][2])
        .toStrictEqual(expectedRoles[0]);
      expect(spies.storage.saveRoleAssociation.mock.calls[1][2])
        .toStrictEqual(expectedRoles[1]);
    });

    test('should skip indexing if there is no recipient', async () => {
      const spies = spy();

      delete transaction.recipient;

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveRoleAssociation.mock.calls.length).toBe(0);
    });

    test('should skip indexing if there is no association type', async () => {
      const spies = spy();

      delete transaction.associationType;

      await trustNetworkService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveRoleAssociation.mock.calls.length).toBe(0);
    });
  });

  describe('getRolesFor()', () => {
    test('should resolve the roles for an address', async () => {
      const spies = spy();

      const result = await trustNetworkService.getRolesFor('mock-recipient');

      const expected: RoleData = {
        roles: [ 'authority' ],
        issues_roles: [{ type: 100, role: 'university' }, { type: 101, role: 'sub_authority' }],
        issues_authorization: ['https://www.w3.org/2018/credentials/examples/v1']
      };

      expect(spies.config.getRoles.mock.calls.length).toBe(1);
      expect(spies.storage.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.storage.getRolesFor.mock.calls[0][0])
        .toBe('mock-recipient');
      expect(result).toStrictEqual(expected);
    });

    test('should return root roles if address is in node wallet', async () => {
      const spies = spy();

      const result = await trustNetworkService.getRolesFor('node-address');
      const expected: RoleData = {
        roles: [ 'root' ],
        issues_roles: [{ type: 100, role: 'authority' }],
        issues_authorization: []
      };

      expect(spies.storage.getRolesFor.mock.calls.length).toBe(0);
      expect(result).toStrictEqual(expected);
    });

    test('should not return the same role twice', async () => {
      const spies = spy();

      spies.storage.getRolesFor = jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => {
        return {
          authority: { sender: 'mock-sender', type: 100 },
          sub_authority: { sender: 'mock-sender', type: 101 },
        };
      });

      const result = await trustNetworkService.getRolesFor('mock-recipient');
      const expected: RoleData = {
        roles: [ 'authority', 'sub_authority' ],
        issues_roles: [{ type: 100, role: 'university' }, { type: 101, role: 'sub_authority' }],
        issues_authorization: ['https://www.w3.org/2018/credentials/examples/v1']
      };

      expect(result).toStrictEqual(expected);
    });

    test('should not return the same authorization twice', async () => {
      const spies = spy();

      spies.storage.getRolesFor = jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => {
        return {
          authority: { sender: 'mock-sender', type: 100 },
          university: { sender: 'mock-sender', type: 100 },
        };
      });

      const result = await trustNetworkService.getRolesFor('mock-recipient');
      const expected: RoleData = {
        roles: [ 'authority', 'university' ],
        issues_roles: [{ type: 100, role: 'university' }, { type: 101, role: 'sub_authority' }],
        issues_authorization: ['https://www.w3.org/2018/credentials/examples/v1']
      };

      expect(result).toStrictEqual(expected);
    });
  });
});
