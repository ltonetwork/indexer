import { Test, TestingModule } from '@nestjs/testing';
import { VerificationMethodModuleConfig } from './verification-method.module';
import { VerificationMethodService } from './verification-method.service';
import { StorageService } from '../storage/storage.service';
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
      saveVerificationMethod: jest.spyOn(storageService, 'saveVerificationMethod').mockImplementation(async () => { }),
      getVerificationMethods: jest.spyOn(storageService, 'getVerificationMethods').mockImplementation(async () => [ expectedMethod ]),
    };

    return { storage };
  }

  beforeEach(async () => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(mockTimestamp);

    module = await Test.createTestingModule(VerificationMethodModuleConfig).compile();
    await module.init();

    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);
    storageService = module.get<StorageService>(StorageService);

    transaction = {
      id: 'fake_transaction',
      type: 1,
      sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      party: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
      associationType: 0x0107,
    };

    expectedMethod = new VerificationMethod(transaction.associationType, transaction.sender, transaction.party, Math.floor(mockTimestamp / 1000));
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index', () => {
    test('should index a new verification method', async () => {
      const spies = spy();

      await verificationMethodService.index({transaction: transaction as any, blockHeight: 1, position: 0});      

      expect(spies.storage.saveVerificationMethod.mock.calls.length).toBe(1);
      expect(spies.storage.saveVerificationMethod.mock.calls[0][0])
        .toBe(transaction.sender);
      expect(spies.storage.saveVerificationMethod.mock.calls[0][1])
        .toStrictEqual(expectedMethod);
    });

    test('should not index if party is unknown', async () => {
      const spies = spy();

      transaction.party = null;

      await verificationMethodService.index({transaction: transaction as any, blockHeight: 1, position: 0});

      expect(spies.storage.saveVerificationMethod.mock.calls.length).toBe(0);
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
        transaction.party,
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
