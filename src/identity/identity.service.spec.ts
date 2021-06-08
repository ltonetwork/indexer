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

  const publicKey = '6wx5nshSAkF7GEgxZRet86XnqSog3k3DzkyCaBKStiUd';
  const sender = {
    chainId: 'T',
    address: '3N6mZMgGqYn9EVAR2Vbf637iej4fFipECq8',
  };

  const recipient = {
    chainId: 'T',
    address: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
  };

  const secondRecipient = {
    chainId: 'T',
    address: '3N2kNjWiCMuTgdGcLzx8uHiwBKY2J7Sd3t4',
  };

  function spy() {
    const verificationMethod = {
      getMethodsFor: jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async () => []),
    };

    const storage = {
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async () => publicKey),
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
          id: `did:lto:${sender.address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${sender.address}`,
          publicKeyBase58: publicKey,
          blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
        }],
        authentication: [
          `did:lto:${sender.address}#key`,
        ],
        assertionMethod: [
          `did:lto:${sender.address}#key`,
        ],
        capabilityInvocation: [
          `did:lto:${sender.address}#key`,
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

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [{
          id: `did:lto:${sender.address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${sender.address}`,
          publicKeyBase58: publicKey,
          blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
        }, {
          id: `did:lto:${recipient.address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${recipient.address}`,
          publicKeyBase58: publicKey,
          blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
        }],
        authentication: [
          `did:lto:${recipient.address}#key`,
        ],
        assertionMethod: [
          `did:lto:${recipient.address}#key`,
        ],
        keyAgreement: [
          `did:lto:${recipient.address}#key`,
        ],
      });
    });

    test('should resolve the identity with MULTIPLE additional verification methods', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async (address: string) => {
        const relationships = 0x0107; // authentication, assertion, key agreement
        const secondRelationships = 0x0113; // authentication, assertion, capabilityDelegation

        return [new VerificationMethod(relationships, address, recipient.address, 123456), new VerificationMethod(secondRelationships, address, secondRecipient.address, 123456)];
      });

      const did = await identityService.resolve(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [{
          id: `did:lto:${sender.address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${sender.address}`,
          publicKeyBase58: publicKey,
          blockchainAccountId: `${sender.address}@lto:${sender.chainId}`,
        }, {
          id: `did:lto:${recipient.address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${recipient.address}`,
          publicKeyBase58: publicKey,
          blockchainAccountId: `${recipient.address}@lto:${recipient.chainId}`,
        }, {
          id: `did:lto:${secondRecipient.address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${secondRecipient.address}`,
          publicKeyBase58: publicKey,
          blockchainAccountId: `${secondRecipient.address}@lto:${secondRecipient.chainId}`,
        }],
        authentication: [
          `did:lto:${recipient.address}#key`,
          `did:lto:${secondRecipient.address}#key`,
        ],
        assertionMethod: [
          `did:lto:${recipient.address}#key`,
          `did:lto:${secondRecipient.address}#key`,
        ],
        keyAgreement: [
          `did:lto:${recipient.address}#key`,
        ],
        capabilityDelegation: [
          `did:lto:${secondRecipient.address}#key`,
        ]
      });
    });
  });
});
