import { Test, TestingModule } from '@nestjs/testing';
import { VerificationMethodModuleConfig } from './verification-method.module';
import { VerificationMethodService } from './verification-method.service';
import { StorageService } from '../storage/storage.service';

describe('VerificationMethodService', () => {
  let module: TestingModule;
  let verificationMethodService: VerificationMethodService;
  let storageService: StorageService;

  function spy() {
    const storage = {
      saveVerificationMethod: jest.spyOn(storageService, 'saveVerificationMethod').mockImplementation(async () => { }),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(VerificationMethodModuleConfig).compile();
    await module.init();

    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index', () => {
    let transaction;

    beforeEach(() => {
      transaction = {
        id: 'fake_transaction',
        type: 1,
        sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        recipient: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
        associationType: 0x0107
      };
    });

    test('should process the transaction', async () => {
      const spies = spy();

      await verificationMethodService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveVerificationMethod.mock.calls.length).toBe(1);
      expect(spies.storage.saveVerificationMethod.mock.calls[0][0])
        .toBe('3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL');
      expect(spies.storage.saveVerificationMethod.mock.calls[0][1])
        .toStrictEqual({
          authentication: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ],
          assertionMethod: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ],
          keyAgreement: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ]
        });
    });

    test('should not index if recipient is unknown', async () => {
      const spies = spy();

      transaction.recipient = null;

      await verificationMethodService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveVerificationMethod.mock.calls.length).toBe(0);
    });

    describe('verification methods', () => {
      test('should index authentication and assertionMethod', async () => {
        const spies = spy();

        transaction.associationType = 0x0103;

        await verificationMethodService.index({transaction: transaction as any, blockHeight: 1, position: 0});

        expect(spies.storage.saveVerificationMethod.mock.calls[0][1])
        .toStrictEqual({
          authentication: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ],
          assertionMethod: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ]
        });
      });

      test('should index authentication, assertionMethod, keyAgreement and capabilityInvocation', async () => {
        const spies = spy();

        transaction.associationType = 0x010f;

        await verificationMethodService.index({transaction: transaction as any, blockHeight: 1, position: 0});

        expect(spies.storage.saveVerificationMethod.mock.calls[0][1])
        .toStrictEqual({
          authentication: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ],
          assertionMethod: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ],
          keyAgreement: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ],
          capabilityInvocation: [
            "did:lto:3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL#key"
          ]
        });
      });
    });
  });
});
