import { Test, TestingModule } from '@nestjs/testing';
import { IdentityModuleConfig } from '../did.module';
import { VerificationMethodService } from './verification-method.service';
import { StorageService } from '../../storage/storage.service';
import { VerificationMethod } from './model/verification-method.model';

describe('VerificationMethodService', () => {
  let module: TestingModule;
  let verificationMethodService: VerificationMethodService;
  let storageService: StorageService;

  const mockTimestamp: number = 1623162267;

  let transaction: any;
  let expectedMethod: VerificationMethod;

  function spy() {
    const storage = {
      saveVerificationMethod: jest.spyOn(storageService, 'saveVerificationMethod').mockImplementation(
        async () => { },
      ),
      getVerificationMethods: jest.spyOn(storageService, 'getVerificationMethods').mockImplementation(
        async () => [ expectedMethod ],
      ),
    };

    return { storage };
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(mockTimestamp);

    module = await Test.createTestingModule(IdentityModuleConfig).compile();
    await module.init();

    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);
    storageService = module.get<StorageService>(StorageService);

    transaction = {
      id: 'fake_transaction',
      type: 1,
      sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      recipient: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
      associationType: 0x0107,
    };

    expectedMethod = new VerificationMethod(
      transaction.associationType,
      transaction.sender,
      transaction.recipient,
      Math.floor(mockTimestamp / 1000),
    );
  });

  afterEach(async () => {
    await module.close();
  });

  describe('save', () => {
    test('should save a new verification method', async () => {
      const spies = spy();

      await verificationMethodService.save(transaction.associationType, transaction.sender, transaction.recipient);

      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveVerificationMethod).toHaveBeenNthCalledWith(1, transaction.sender, expectedMethod);
    });
  });

  describe('getMethodsFor', () => {
    test('should return the methods for an address', async () => {
      const spies = spy();

      const result = await verificationMethodService.getMethodsFor(transaction.sender);

      expect(spies.storage.getVerificationMethods.mock.calls.length).toBe(1);
      expect(spies.storage.getVerificationMethods.mock.calls[0][0])
        .toBe(transaction.sender);
      expect(result).toStrictEqual([expectedMethod]);
    });
  });

  describe('revoke', () => {
    test('should revoke a method by adding `revokedAt` property', async () => {
      const spies = spy();

      const expectedRevokedMethod = new VerificationMethod(
        transaction.associationType,
        transaction.sender,
        transaction.recipient,
        Math.floor(mockTimestamp / 1000),
        Math.floor(mockTimestamp / 1000),
      );

      await verificationMethodService.revoke(expectedMethod);

      expect(spies.storage.saveVerificationMethod.mock.calls.length).toBe(1);
      expect(spies.storage.saveVerificationMethod.mock.calls[0][0])
        .toBe(transaction.sender);
      expect(spies.storage.saveVerificationMethod.mock.calls[0][1])
        .toStrictEqual(expectedRevokedMethod);
    });
  });
});
