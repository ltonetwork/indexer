import { Test, TestingModule } from '@nestjs/testing';
import { DidModuleConfig } from './identity.module';
import { IdentityService } from './identity.service';
import { VerificationMethodService } from '../verification-method/verification-method.service';
import { VerificationMethod } from '../verification-method/model/verification-method.model';
import { StorageService } from '../storage/storage.service';

describe('IdentityService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let identityService: IdentityService;
  let verificationMethodService: VerificationMethodService;

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
      getMethodsFor: jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async () => []),
    };

    const storage = {
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async (address: string) => {
        if (address === sender.address) return sender.ed25519PublicKey;
        if (address === recipient.address) return recipient.ed25519PublicKey;
        if (address === secondRecipient.address) return secondRecipient.ed25519PublicKey;

        return null;
      }),
    };

    return { verificationMethod, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(DidModuleConfig).compile();
    await module.init();

    storageService = module.get<StorageService>(StorageService);
    identityService = module.get<IdentityService>(IdentityService);
    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('resolve()', () => {
    test('should resolve the identity with NO additional verification methods', async () => {
      const spies = spy();

      const did = await identityService.resolve(sender.address);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [{
          id: `did:lto:${sender.address}#sign`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${sender.address}`,
          publicKeyBase58: sender.ed25519PublicKey,
          blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
        }],
        authentication: [
          `did:lto:${sender.address}#sign`,
        ],
        assertionMethod: [
          `did:lto:${sender.address}#sign`,
        ],
        capabilityInvocation: [
          `did:lto:${sender.address}#sign`,
        ]
      });

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);
    });

    test('should resolve the identity with ONE additional verification method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async (address: string) => {
        const relationships = 0x0107; // authentication, assertion, key agreement

        return [new VerificationMethod(relationships, address, recipient.address, 123456)];
      });

      const did = await identityService.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(2);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [{
          id: `did:lto:${sender.address}#sign`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${sender.address}`,
          publicKeyBase58: sender.ed25519PublicKey,
          blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
        }, {
          id: `did:lto:${recipient.address}#sign`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${recipient.address}`,
          publicKeyBase58: recipient.ed25519PublicKey,
          blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
        }],
        authentication: [
          `did:lto:${recipient.address}#sign`,
        ],
        assertionMethod: [
          `did:lto:${recipient.address}#sign`,
        ],
        keyAgreement: [{
          id: `did:lto:${recipient.address}#encrypt`,
          type: 'X25519KeyAgreementKey2019',
          controller: `did:lto:${recipient.address}`,
          publicKeyBase58: recipient.x25519PublicKey,
          blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
        }],
      });
    });

    test('should resolve the identity with MULTIPLE additional verification methods', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async (address: string) => {
        const relationships = 0x0107; // authentication, assertion, key agreement
        const secondRelationships = 0x0115; // authentication, assertion, key agreement, capability delegation

        return [new VerificationMethod(relationships, address, recipient.address, 123456), new VerificationMethod(secondRelationships, address, secondRecipient.address, 123456)];
      });

      const did = await identityService.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(3);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [{
          id: `did:lto:${sender.address}#sign`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${sender.address}`,
          publicKeyBase58: sender.ed25519PublicKey,
          blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
        }, {
          id: `did:lto:${recipient.address}#sign`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${recipient.address}`,
          publicKeyBase58: recipient.ed25519PublicKey,
          blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
        }, {
          id: `did:lto:${secondRecipient.address}#sign`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${secondRecipient.address}`,
          publicKeyBase58: secondRecipient.ed25519PublicKey,
          blockchainAccountId: `${secondRecipient.address}@lto:${secondRecipient.chainId}`,
        }],
        authentication: [
          `did:lto:${recipient.address}#sign`,
          `did:lto:${secondRecipient.address}#sign`,
        ],
        assertionMethod: [
          `did:lto:${recipient.address}#sign`,
          `did:lto:${secondRecipient.address}#sign`,
        ],
        keyAgreement: [{
          id: `did:lto:${recipient.address}#encrypt`,
          type: 'X25519KeyAgreementKey2019',
          controller: `did:lto:${recipient.address}`,
          publicKeyBase58: recipient.x25519PublicKey,
          blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
        }, {
          id: `did:lto:${secondRecipient.address}#encrypt`,
          type: 'X25519KeyAgreementKey2019',
          controller: `did:lto:${secondRecipient.address}`,
          publicKeyBase58: secondRecipient.x25519PublicKey,
          blockchainAccountId: `${secondRecipient.address}@lto:${secondRecipient.chainId}`,
        }],
        capabilityDelegation: [
          `did:lto:${secondRecipient.address}#sign`,
        ]
      });
    });
  });
});
