import { Test, TestingModule } from '@nestjs/testing';
import { IdentityModuleConfig } from './did.module';
import { DIDService } from './did.service';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { VerificationMethod } from './verification-method/model/verification-method.model';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';

describe('DIDService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let service: DIDService;
  let verificationMethodService: VerificationMethodService;

  let transaction: Transaction;

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
      savePublicKey: jest.spyOn(storageService, 'savePublicKey').mockImplementation((async () => {}) as any),
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async (address: string) => {
        if (address === sender.address) return { publicKey: sender.ed25519PublicKey, keyType: 'ed25519' };
        if (address === recipient.address) return { publicKey: recipient.ed25519PublicKey, keyType: 'ed25519' };
        if (address === secondRecipient.address) return { publicKey: secondRecipient.ed25519PublicKey, keyType: 'ed25519' };

        return {publicKey: '', keyType: ''};
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
    service = module.get<DIDService>(DIDService);
    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);

    // @ts-ignore
    transaction = {
      id: 'fake_transaction',
      type: 1,
      sender: '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL',
      senderPublicKey: 'AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG',
      senderKeyType: 'ed25519',
    };

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('resolve()', () => {
    test('should resolve the identity with NO additional verification methods', async () => {
      const spies = spy();

      const did = await service.resolve(sender.address);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': `did:lto:${sender.address}`,
        'verificationMethod': [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.ed25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
        ],
        'authentication': [`did:lto:${sender.address}#sign`],
        'assertionMethod': [`did:lto:${sender.address}#sign`],
        'capabilityInvocation': [`did:lto:${sender.address}#sign`],
      });

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);
    });

    test('should resolve the identity with ONE additional verification method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async () => {
          const relationships = 0x0107; // authentication, assertion, key agreement
          return [new VerificationMethod(relationships, recipient.address, 0)];
        });

      const did = await service.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(2);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': `did:lto:${sender.address}`,
        'verificationMethod': [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.ed25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${recipient.address}`,
            publicKeyBase58: recipient.ed25519PublicKey,
            blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
          },
        ],
        'authentication': [
          `did:lto:${sender.address}#sign`,
          `did:lto:${recipient.address}#sign`,
        ],
        'assertionMethod': [
          `did:lto:${sender.address}#sign`,
          `did:lto:${recipient.address}#sign`,
        ],
        'capabilityInvocation': [
          `did:lto:${sender.address}#sign`,
        ],
        'keyAgreement': [
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

    test('should resolve the identity with reconfigured default verification method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
          .spyOn(verificationMethodService, 'getMethodsFor')
          .mockImplementation(async () => {
            const relationships = 0x0105; // authentication, key agreement
            return [new VerificationMethod(relationships, sender.address, 0)];
          });

      const did = await service.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(2);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': `did:lto:${sender.address}`,
        'verificationMethod': [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.ed25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
        ],
        'authentication': [
          `did:lto:${sender.address}#sign`,
        ],
        'keyAgreement': [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.x25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
        ],
      });
    });

    test('should resolve the identity with MULTIPLE additional verification methods', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async () => {
          const relationships = 0x0107; // authentication, assertion, key agreement
          const secondRelationships = 0x0115; // authentication, assertion, key agreement, capability delegation

          return [
            new VerificationMethod(relationships, recipient.address, 0),
            new VerificationMethod(secondRelationships, secondRecipient.address, 0),
          ];
        });

      const did = await service.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(3);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': `did:lto:${sender.address}`,
        'verificationMethod': [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyBase58: sender.ed25519PublicKey,
            blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
          },
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${recipient.address}`,
            publicKeyBase58: recipient.ed25519PublicKey,
            blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
          },
          {
            id: `did:lto:${secondRecipient.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${secondRecipient.address}`,
            publicKeyBase58: secondRecipient.ed25519PublicKey,
            blockchainAccountId: `${secondRecipient.address}@lto:${secondRecipient.chainId}`,
          },
        ],
        'authentication': [
          `did:lto:${sender.address}#sign`,
          `did:lto:${recipient.address}#sign`,
          `did:lto:${secondRecipient.address}#sign`,
        ],
        'assertionMethod': [
          `did:lto:${sender.address}#sign`,
          `did:lto:${recipient.address}#sign`,
        ],
        'keyAgreement': [
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
        'capabilityInvocation': [`did:lto:${sender.address}#sign`],
        'capabilityDelegation': [`did:lto:${secondRecipient.address}#sign`],
      });
    });

    describe('cross chain identities', () => {
      const offChainSenderDID = 'did:ltox:eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb';

      test('should resolve a cross chain identity', async () => {
        const spies = spy();

        spies.storage.getAssociations = jest.spyOn(storageService, 'getAssociations').mockImplementation(async () => {
          return { children: [sender.address], parents: [] };
        });

        const did = await service.resolve(offChainSenderDID);

        expect(did).toEqual({
          '@context': 'https://www.w3.org/ns/did/v1',
          'id': offChainSenderDID,
          'alsoKnownAs': [`did:lto:${sender.address}`],
          'verificationMethod': [
            {
              id: `did:lto:${sender.address}#sign`,
              type: 'Ed25519VerificationKey2020',
              controller: `did:lto:${sender.address}`,
              publicKeyBase58: sender.ed25519PublicKey,
              blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
            },
          ],
          'authentication': [`did:lto:${sender.address}#sign`],
          'assertionMethod': [`did:lto:${sender.address}#sign`],
          'capabilityInvocation': [`did:lto:${sender.address}#sign`],
        });

        expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
        expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);
      });

      test.skip('should fail if sender address has not been indexed/associated with a known LTO address', async () => {
        const did = await service.resolve(offChainSenderDID);
        expect(did).toBeNull();
      });
    });
  });
});
