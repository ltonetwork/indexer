import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from './associations.service';
import { AssociationsModuleConfig } from './associations.module';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';

describe('AssociationsService', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let storageService: StorageService;
  let trustService: TrustNetworkService;
  let associationsService: AssociationsService;

  function spy() {
    const storage = {
      saveAssociation: jest.spyOn(storageService, 'saveAssociation').mockImplementation(async () => {}),
      removeAssociation: jest.spyOn(storageService, 'removeAssociation').mockImplementation(async () => {}),
      getRolesFor: jest.spyOn(storageService, 'getRolesFor').mockImplementation(async () => {
        return { root: { description: 'The root role' } };
      }),
      getAssociations: jest.spyOn(storageService, 'getAssociations').mockImplementation(async () => {
        return {
          parents: [],
        };
      }),
    };

    const trust = {
      getRolesFor: jest.spyOn(trustService, 'getRolesFor').mockImplementation(async () => {
        return {
          roles: ['root'],
          issues_roles: [],
          issues_authorization: [],
        };
      }),
    };

    const logger = {
      debug: jest.spyOn(loggerService, 'debug').mockImplementation(() => {}),
    };

    const config = {
      isEip155IndexingEnabled: jest.spyOn(configService, 'isEip155IndexingEnabled').mockImplementation(() => false),
    };

    return { storage, logger, trust, config };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AssociationsModuleConfig).compile();

    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
    storageService = module.get<StorageService>(StorageService);
    trustService = module.get<TrustNetworkService>(TrustNetworkService);
    associationsService = module.get<AssociationsService>(AssociationsService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index()', () => {
    test('should index an association', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
      };

      await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'all');

      expect(spies.trust.getRolesFor.mock.calls.length).toBe(0);

      expect(spies.logger.debug.mock.calls.length).toBe(1);
      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Saving association');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(1);
      expect(spies.storage.saveAssociation.mock.calls[0]).toEqual([transaction.sender, transaction.recipient]);

      expect(spies.storage.removeAssociation.mock.calls.length).toBe(0);
    });

    test('should remove an association', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 17,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
      };

      await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'all');

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Removing association');

      expect(spies.storage.removeAssociation.mock.calls.length).toBe(1);
      expect(spies.storage.removeAssociation.mock.calls[0]).toEqual([transaction.sender, transaction.recipient]);

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
    });

    test('should skip if transaction type is not association', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 12,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      };

      await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'all');

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Unknown transaction type');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
      expect(spies.storage.removeAssociation.mock.calls.length).toBe(0);
    });

    test('should index config "trust" if sender is trusted', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      };

      await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'trust');

      expect(spies.trust.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.trust.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Saving association');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(1);
    });

    test('should not index config "trust" if sender is not trusted', async () => {
      const spies = spy();

      spies.trust.getRolesFor.mockImplementation(async () => {
        return {
          roles: [],
          issues_roles: [],
          issues_authorization: [],
        };
      });

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      };

      await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'trust');

      expect(spies.trust.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.trust.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
    });

    describe('cross chain associations', () => {
      test('should not index cross chain associations if config is false', async () => {
        const spies = spy();

        spies.config.isEip155IndexingEnabled.mockImplementation(() => false);

        const transaction = {
          id: 'fake_transaction',
          type: 16,
          sender: '0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
          senderKeyType: 'sep256k1',
          recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
        };

        await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'all');

        expect(spies.logger.debug.mock.calls.length).toBe(1);
        expect(spies.logger.debug.mock.calls[0][0]).toBe(
          'association-service: Cross chain indexing is disabled, but sender key type is sep256k1',
        );

        expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
      });

      test('should not index cross chain associations if sender key type is unknown', async () => {
        const spies = spy();

        spies.config.isEip155IndexingEnabled.mockImplementation(() => true);

        const transaction = {
          id: 'fake_transaction',
          type: 16,
          sender: '0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
          senderKeyType: 'something_else',
          recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
        };

        await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'all');

        expect(spies.logger.debug.mock.calls.length).toBe(1);
        expect(spies.logger.debug.mock.calls[0][0]).toBe(
          'association-service: Cross chain indexing is enabled, but the sender key type is unknown',
        );

        expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
      });

      test('should index cross chain associations if config is true and sender key type is known', async () => {
        const spies = spy();

        spies.config.isEip155IndexingEnabled.mockImplementation(() => true);

        const transaction = {
          id: 'fake_transaction',
          type: 16,
          sender: '0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
          senderKeyType: 'sep256k1',
          recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
        };

        await associationsService.index({ transaction: transaction as any, blockHeight: 1, position: 0 }, 'all');

        expect(spies.logger.debug.mock.calls.length).toBe(1);
        expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Saving association');

        expect(spies.storage.saveAssociation.mock.calls.length).toBe(1);
        expect(spies.storage.saveAssociation.mock.calls[0]).toEqual([transaction.sender, transaction.recipient]);

        expect(spies.storage.removeAssociation.mock.calls.length).toBe(0);
      });
    });
  });

  describe('getAssociations()', () => {
    test('should return from storage service', async () => {
      const spies = spy();

      const result = await associationsService.getAssociations('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');

      expect(spies.storage.getAssociations.mock.calls.length).toBe(1);
      expect(spies.storage.getAssociations.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');

      expect(result).toEqual({ parents: [] });
    });
  });
});
