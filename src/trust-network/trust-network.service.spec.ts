import { Test, TestingModule } from '@nestjs/testing';
import { TrustNetworkModuleConfig } from './trust-network.module';
import { TrustNetworkService } from './trust-network.service';
import { StorageService } from '../storage/storage.service';

describe('TrustNetworkService', () => {
  let module: TestingModule;

  let storageService: StorageService;
  let trustNetworkService: TrustNetworkService;

  function spy() {
    const storage = {
      // saveTrustNetwork: jest.spyOn(storageService, 'saveTrustNetwork').mockImplementation(async () => { }),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TrustNetworkModuleConfig).compile();
    await module.init();

    storageService = module.get<StorageService>(StorageService);
    trustNetworkService = module.get<TrustNetworkService>(TrustNetworkService);
  });

  afterEach(async () => {
    await module.close();
  });

  // @todo: make proper tests
  describe('index', () => {
    test('temporary test', () => {
      expect(true).toBe(true);
    });
  });
});
