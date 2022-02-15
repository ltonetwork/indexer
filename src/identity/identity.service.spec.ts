import { Test, TestingModule } from '@nestjs/testing';
import { IdentityModuleConfig } from './identity.module';
import { IdentityService } from './identity.service';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { VerificationMethod } from './verification-method/model/verification-method.model';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';

describe('IdentityService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let identityService: IdentityService;
  let verificationMethodService: VerificationMethodService;

  let transaction: Transaction;

  const sender = {
    chainId: 'T',
    address: '3N6mZMgGqYn9EVAR2Vbf637iej4fFipECq8',
    ed25519PublicKey: '6wx5nshSAkF7GEgxZRet86XnqSog3k3DzkyCaBKStiUd',
  };

  const recipient = {
    chainId: 'T',
    address: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
    ed25519PublicKey: '6YQpeq9Yeh3VDAuVQvnUQLcUTnEq9hPUwCb9nX3yZHPC',
    x25519PublicKey: '37CFMfB3MU1tzJKNVadeZiGytUH6HFLDNNeJETzY7N8o',
  };

  const secondRecipient = {
    chainId: 'T',
    address: '3N2kNjWiCMuTgdGcLzx8uHiwBKY2J7Sd3t4',
    ed25519PublicKey: 'DeAxCdh1pYXpU7h41ieyqTDrTyQmhJWZarqxTtkmJv99',
    x25519PublicKey: 'E6C6H2pfFvjwxELHK63kcekh2ADhFM2Zt5wqKkStSAxX',
  };

  function spy() {
    const verificationMethod = {
      save: jest.spyOn(verificationMethodService, 'save').mockImplementation(async () => {}),
      getMethodsFor: jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async () => []),
    };

    const storage = {
      savePublicKey: jest.spyOn(storageService, 'savePublicKey').mockImplementation(async () => {}),
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async (address: string) => {
        if (address === sender.address) return sender.ed25519PublicKey;
        if (address === recipient.address) return recipient.ed25519PublicKey;
        if (address === secondRecipient.address) return secondRecipient.ed25519PublicKey;

        return null;
      }),
      getAssociations: jest.spyOn(storageService, 'getAssociations').mockImplementation(async () => {
        return { children: [], parents: [] };
      }),
    };

    return { verificationMethod, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(IdentityModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    identityService = module.get<IdentityService>(IdentityService);
    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);

    // @ts-ignore
    transaction = {
      id: 'fake_transaction',
      type: 1,
      sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      senderPublicKey: 'AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG',
    };

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index', () => {
    test('should save public key of transaction sender', async () => {
      const spies = spy();

      await identityService.index({ transaction, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.save).toHaveBeenCalledTimes(0);

      expect(spies.storage.savePublicKey).toHaveBeenCalledTimes(1);
      expect(spies.storage.savePublicKey).toHaveBeenNthCalledWith(1, transaction.sender, transaction.senderPublicKey);
    });

    test('should save verification method if transaction has "recipient" property', async () => {
      const spies = spy();

      // @ts-ignore
      transaction.associationType = 0x0107;
      // @ts-ignore
      transaction.recipient = '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ';

      await identityService.index({ transaction, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.save).toHaveBeenCalledTimes(1);
      expect(spies.verificationMethod.save).toHaveBeenNthCalledWith(
        1,
        transaction.associationType,
        transaction.sender,
        transaction.recipient,
      );
    });
  });

  describe('resolve()', () => {
    test('should resolve the identity with NO additional verification methods', async () => {
      const spies = spy();

      const did = await identityService.resolve(sender.address);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.ed25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
      });

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);
    });

    test('should resolve the identity with ONE additional verification method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async (address: string) => {
          const relationships = 0x0107; // authentication, assertion, key agreement

          return [new VerificationMethod(relationships, address, recipient.address, 123456)];
        });

      const did = await identityService.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(2);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.ed25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:lto:${recipient.address}`,
            publicKeyBase58: recipient.ed25519PublicKey,
            blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
          },
        ],
        authentication: [`did:lto:${recipient.address}#sign`],
        assertionMethod: [`did:lto:${recipient.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${recipient.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${recipient.address}`,
            publicKeyBase58: recipient.x25519PublicKey,
            blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
          },
        ],
      });
    });

    test('should resolve the identity with MULTIPLE additional verification methods', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async (address: string) => {
          const relationships = 0x0107; // authentication, assertion, key agreement
          const secondRelationships = 0x0115; // authentication, assertion, key agreement, capability delegation

          return [
            new VerificationMethod(relationships, address, recipient.address, 123456),
            new VerificationMethod(secondRelationships, address, secondRecipient.address, 123456),
          ];
        });

      const did = await identityService.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(3);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.ed25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:lto:${recipient.address}`,
            publicKeyBase58: recipient.ed25519PublicKey,
            blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
          },
          {
            id: `did:lto:${secondRecipient.address}#sign`,
            type: 'Ed25519VerificationKey2018',
            controller: `did:lto:${secondRecipient.address}`,
            publicKeyBase58: secondRecipient.ed25519PublicKey,
            blockchainAccountId: `${secondRecipient.address}@lto:${secondRecipient.chainId}`,
          },
        ],
        authentication: [`did:lto:${recipient.address}#sign`, `did:lto:${secondRecipient.address}#sign`],
        assertionMethod: [`did:lto:${recipient.address}#sign`, `did:lto:${secondRecipient.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${recipient.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${recipient.address}`,
            publicKeyBase58: recipient.x25519PublicKey,
            blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
          },
          {
            id: `did:lto:${secondRecipient.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${secondRecipient.address}`,
            publicKeyBase58: secondRecipient.x25519PublicKey,
            blockchainAccountId: `${secondRecipient.address}@lto:${secondRecipient.chainId}`,
          },
        ],
        capabilityDelegation: [`did:lto:${secondRecipient.address}#sign`],
      });
    });

    describe('cross chain identities', () => {
      const offChainSenderAddress = '0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb';

      test('should resolve a cross chain identity', async () => {
        const spies = spy();

        spies.storage.getAssociations = jest.spyOn(storageService, 'getAssociations').mockImplementation(async () => {
          return { children: [sender.address], parents: [] };
        });

        const did = await identityService.resolve(offChainSenderAddress);

        expect(did).toEqual({
          '@context': 'https://www.w3.org/ns/did/v1',
          id: `did:ltox:eip155:1${offChainSenderAddress}`,
          alsoKnownAs: [`did:lto:${sender.address}`],
          verificationMethod: [
            {
              id: `did:lto:${sender.address}#sign`,
              type: 'Ed25519VerificationKey2018',
              controller: `did:lto:${sender.address}`,
              publicKeyBase58: sender.ed25519PublicKey,
              blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
            },
          ],
          authentication: [`did:lto:${sender.address}#sign`],
          assertionMethod: [`did:lto:${sender.address}#sign`],
          capabilityInvocation: [`did:lto:${sender.address}#sign`],
        });

        expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
        expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);
      });

      test('should fail if sender address has not been indexed/associated with a known LTO address', async () => {
        const spies = spy();

        const did = await identityService.resolve(offChainSenderAddress);

        expect(did).toBeNull();
      });
    });
  });
});
