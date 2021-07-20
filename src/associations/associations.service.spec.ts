import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from './associations.service';
import { AssociationsModuleConfig } from './associations.module';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';

describe('AssociationsService', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let storageService: StorageService;
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
          parents: []
        }
      }),
    };

    const config = {
      getAssociationIndexing: jest.spyOn(configService, 'getAssociationIndexing').mockImplementation(() => 'all'),
      getAssociationsRoot: jest.spyOn(configService, 'getAssociationsRoot').mockImplementation(() => '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'),
    };

    const logger = {
      debug: jest.spyOn(loggerService, 'debug').mockImplementation(() => {}),
    };

    return { storage, config, logger };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AssociationsModuleConfig).compile();

    loggerService = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
    storageService = module.get<StorageService>(StorageService);
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
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.config.getAssociationsRoot.mock.calls.length).toBe(1);
      expect(spies.config.getAssociationIndexing.mock.calls.length).toBe(1);

      expect(spies.storage.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.storage.getRolesFor.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
      expect(spies.storage.getAssociations.mock.calls.length).toBe(1);
      expect(spies.storage.getAssociations.mock.calls[0][0]).toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
      
      expect(spies.logger.debug.mock.calls.length).toBe(1);
      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Saving association');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(1);
      expect(spies.storage.saveAssociation.mock.calls[0][0]).toEqual(transaction);

      expect(spies.storage.removeAssociation.mock.calls.length).toBe(0);
    });

    test('should remove an association', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 17,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});
      
      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Removing association');

      expect(spies.storage.removeAssociation.mock.calls.length).toBe(1);
      expect(spies.storage.removeAssociation.mock.calls[0][0]).toEqual(transaction);

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
    });

    test('should skip if transaction type is not association', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 12,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Unknown transaction type');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
      expect(spies.storage.removeAssociation.mock.calls.length).toBe(0);
    });

    test('should index if sender is not root but is registered provider (has parents)', async () => {
      const spies = spy();

      spies.storage.getAssociations.mockImplementation(async () => {
        return { parents: ['3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'] };
      });

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(1);
    });
    
    test('should not index if sender is unregistered provider (not root and no parents)', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Sender is unregistered provider');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
    });

    test('should not index if config is set to "none"', async () => {
      const spies = spy();

      spies.config.getAssociationIndexing.mockImplementation(() => 'none');

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Association indexing set to "none"');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
    });

    test('should index config "trust" if sender is trusted', async () => {
      const spies = spy();

      spies.config.getAssociationIndexing.mockImplementation(() => 'trust');

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Saving association');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(1);
    });

    test('should not index config "trust" if sender is not trusted', async () => {
      const spies = spy();

      spies.config.getAssociationIndexing.mockImplementation(() => 'trust');
      spies.storage.getRolesFor.mockImplementation(async () => { return {} });

      const transaction = {
        id: 'fake_transaction',
        type: 16,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL'
      };

      await associationsService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.logger.debug.mock.calls[0][0]).toBe('association-service: Sender is not part of trust network');

      expect(spies.storage.saveAssociation.mock.calls.length).toBe(0);
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
