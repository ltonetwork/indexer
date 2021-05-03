import { Test, TestingModule } from '@nestjs/testing';
import { PublicKeyModuleConfig } from './public-key.module';
import { PublicKeyService } from './public-key.service';
import { StorageService } from '../storage/storage.service';

describe('PublicKeyService', () => {
  let module: TestingModule;
  let publicKeyService: PublicKeyService;
  let storageService: StorageService;

  function spy() {
    const storage = {
      savePublicKey: jest.spyOn(storageService, 'savePublicKey').mockImplementation(async () => { }),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(PublicKeyModuleConfig).compile();
    await module.init();

    publicKeyService = module.get<PublicKeyService>(PublicKeyService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index', () => {
    test('should process the transaction', async () => {
      const spies = spy();

      const transaction = {
        id: 'fake_transaction',
        type: 1,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        senderPublicKey: 'AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG',
      };
      await publicKeyService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.savePublicKey.mock.calls.length).toBe(1);
      expect(spies.storage.savePublicKey.mock.calls[0][0])
        .toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
      expect(spies.storage.savePublicKey.mock.calls[0][1])
        .toBe('AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG');
    });
  });
});
