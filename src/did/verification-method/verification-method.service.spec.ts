// noinspection DuplicatedCode

import { Test, TestingModule } from '@nestjs/testing';
import { IdentityModuleConfig } from '../did.module';
import { VerificationMethodService } from './verification-method.service';
import { StorageService } from '../../storage/storage.service';
import { VerificationMethod } from './model/verification-method.model';

describe('VerificationMethodService', () => {
  let module: TestingModule;
  let verificationMethodService: VerificationMethodService;
  let storageService: StorageService;

  const mockTimestamp: number = new Date('2023-01-01T00:00:00.000Z').getTime();

  const sender = {
    chainId: 'T',
    address: '3N6mZMgGqYn9EVAR2Vbf637iej4fFipECq8',
    ed25519PublicKey: '6wx5nshSAkF7GEgxZRet86XnqSog3k3DzkyCaBKStiUd',
    x25519PublicKey: '8mKEv5qc9WV6vdBFyrFcHW7Jhdz89ypzB9bp7m7Sx3Dx',
  };

  const recipient = {
    chainId: 'T',
    address: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
    ed25519PublicKey: '6YQpeq9Yeh3VDAuVQvnUQLcUTnEq9hPUwCb9nX3yZHPC',
    x25519PublicKey: '37CFMfB3MU1tzJKNVadeZiGytUH6HFLDNNeJETzY7N8o',
  };

  const secondRecipient = {
    chainId: 'T',
    address: '3MsE8Jfjkh2zaZ1LCGqaDzB5nAYw5FXhfCx',
    secp256k1PublicKey: 'DeAxCdh1pYXpU7h41ieyqTDrTyQmhJWZarqxTtkmJv99',
  };

  function spy() {
    const storage = {
      saveVerificationMethod: jest.spyOn(storageService, 'saveVerificationMethod').mockResolvedValue(undefined),
      getVerificationMethods: jest.spyOn(storageService, 'getVerificationMethods').mockResolvedValue([]),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(IdentityModuleConfig).compile();
    await module.init();

    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('save', () => {
    test('should save a new verification method', async () => {
      const spies = spy();

      await verificationMethodService.save(
        0x100,
        sender.address,
        recipient.address,
        { authentication: true, assertionMethod: true },
        mockTimestamp,
      );

      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledWith(
        sender.address,
        new VerificationMethod(0x103, recipient.address, mockTimestamp),
      );
    });

    test('should save a new verification method based on association type', async () => {
      const spies = spy();

      await verificationMethodService.save(
        0x103,
        sender.address,
        recipient.address,
        {},
        mockTimestamp,
      );

      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledWith(
        sender.address,
        new VerificationMethod(0x103, recipient.address, mockTimestamp),
      );
    });
  });

  describe('revoke', () => {
    test('should add a revoke method with relationship zero', async () => {
      const spies = spy();

      await verificationMethodService.revoke(sender.address, recipient.address, mockTimestamp);

      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledWith(
        sender.address,
        new VerificationMethod(0, recipient.address, mockTimestamp),
      );
    });

    test('should add a method with all relationships for own address', async () => {
      const spies = spy();

      await verificationMethodService.revoke(sender.address, sender.address, mockTimestamp);

      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveVerificationMethod).toHaveBeenCalledWith(
        sender.address,
        new VerificationMethod(0x11f, sender.address, mockTimestamp),
      );
    });
  });

  describe('getMethodsFor', () => {
    test('should return the default methods for an address', async () => {
      const spies = spy();

      const result = await verificationMethodService.getMethodsFor(sender.address);

      expect(spies.storage.getVerificationMethods).toHaveBeenCalledTimes(1);
      expect(spies.storage.getVerificationMethods).toHaveBeenCalledWith(sender.address);
      expect(result).toStrictEqual([
        new VerificationMethod(0x11f, sender.address, 0),
      ]);
    });

    test('should return the latest methods for an address', async () => {
      const spies = spy();

      spies.storage.getVerificationMethods.mockResolvedValue([
        new VerificationMethod(0x101, recipient.address, mockTimestamp),
        new VerificationMethod(0x107, secondRecipient.address, mockTimestamp),
        new VerificationMethod(0x118, sender.address, mockTimestamp + 1000),
        new VerificationMethod(0x103, recipient.address, mockTimestamp + 1000),
        new VerificationMethod(0, secondRecipient.address, mockTimestamp + 1000),
      ]);

      const result = await verificationMethodService.getMethodsFor(sender.address);

      expect(spies.storage.getVerificationMethods).toHaveBeenCalledTimes(1);
      expect(spies.storage.getVerificationMethods).toHaveBeenCalledWith(sender.address);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(new VerificationMethod(0x118, sender.address, mockTimestamp + 1000));
      expect(result).toContainEqual(new VerificationMethod(0x103, recipient.address, mockTimestamp + 1000));
    });

    test('should return the methods based on version time', async () => {
      const spies = spy();

      spies.storage.getVerificationMethods.mockResolvedValue([
        new VerificationMethod(0x101, recipient.address, mockTimestamp),
        new VerificationMethod(0x107, secondRecipient.address, mockTimestamp),
        new VerificationMethod(0x118, sender.address, mockTimestamp + 1000),
        new VerificationMethod(0x103, recipient.address, mockTimestamp + 1000),
        new VerificationMethod(0, secondRecipient.address, mockTimestamp + 1000),
      ]);

      const result = await verificationMethodService.getMethodsFor(sender.address, mockTimestamp + 1);

      expect(spies.storage.getVerificationMethods).toHaveBeenCalledTimes(1);
      expect(spies.storage.getVerificationMethods).toHaveBeenCalledWith(sender.address);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual(new VerificationMethod(0x11f, sender.address, 0));
      expect(result).toContainEqual(new VerificationMethod(0x101, recipient.address, mockTimestamp));
      expect(result).toContainEqual(new VerificationMethod(0x107, secondRecipient.address, mockTimestamp));
    });

    test('should not return an expired method', async () => {
      const spies = spy();

      spies.storage.getVerificationMethods.mockResolvedValue([
        new VerificationMethod(0x101, recipient.address, mockTimestamp, mockTimestamp + 1000),
      ]);

      const result1 = await verificationMethodService.getMethodsFor(sender.address, mockTimestamp + 1);
      expect(result1).toHaveLength(2);
      expect(result1).toContainEqual(new VerificationMethod(0x11f, sender.address, 0));
      expect(result1).toContainEqual(
        new VerificationMethod(0x101, recipient.address, mockTimestamp, mockTimestamp + 1000),
      );

      const result2 = await verificationMethodService.getMethodsFor(sender.address, mockTimestamp + 2000);
      expect(result2).toHaveLength(1);
      expect(result2).toContainEqual(new VerificationMethod(0x11f, sender.address, 0));
    });

    test('should return the implicit method if method for own address is expired', async () => {
      const spies = spy();

      spies.storage.getVerificationMethods.mockResolvedValue([
        new VerificationMethod(0x118, sender.address, mockTimestamp, mockTimestamp + 1000),
      ]);

      const result1 = await verificationMethodService.getMethodsFor(sender.address, mockTimestamp + 1);
      expect(result1).toHaveLength(1);
      expect(result1).toContainEqual(
        new VerificationMethod(0x118, sender.address, mockTimestamp, mockTimestamp + 1000),
      );

      const result2 = await verificationMethodService.getMethodsFor(sender.address, mockTimestamp + 2000);
      expect(result2).toHaveLength(1);
      expect(result2).toContainEqual(new VerificationMethod(0x11f, sender.address, 0));
    });
  });
});
