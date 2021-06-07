import { Test, TestingModule } from '@nestjs/testing';
import { DidModuleConfig } from './identity.module';
import { IdentityService } from './identity.service';
import { VerificationMethodService } from '../verification-method/verification-method.service';
import { VerificationMethod } from '../verification-method/model/verification-method.model';
import { StorageService } from '../storage/storage.service';
import * as LTOCrypto from '@lto-network/lto-crypto';

describe('IdentityService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let identityService: IdentityService;
  let verificationMethodService: VerificationMethodService;

  function spy() {
    const verificationMethod = {
      getMethodsFor: jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async () => []),
    };

    const storage = {
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async () => 'publicKey'),
    };

    const crypto = {
      chainIdOf: jest.spyOn(LTOCrypto, 'chainIdOf').mockImplementation(() => 'chainId'),
    }

    return { verificationMethod, storage, crypto };
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

      const did = await identityService.resolve('sender');

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: 'did:lto:sender',
        verificationMethod: [{
          id: 'did:lto:sender#key',
          type: 'Ed25519VerificationKey2018',
          controller: 'did:lto:sender',
          publicKeyBase58: 'publicKey',
          blockchainAccountId: 'sender@lto:chainId',
        }],
        authentication: [
          'did:lto:sender#key',
        ],
        assertionMethod: [
          'did:lto:sender#key',
        ],
        capabilityInvocation: [
          'did:lto:sender#key',
        ]
      });

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);
    });

    test('should resolve the identity with ONE additional verification method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async (address: string) => {
        const relationships = 0x0107; // authentication, assertion, key agreement

        return [new VerificationMethod(relationships, address, 'recipient')];
      });

      const did = await identityService.resolve('sender');

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: 'did:lto:sender',
        verificationMethod: [{
          id: 'did:lto:sender#key',
          type: 'Ed25519VerificationKey2018',
          controller: 'did:lto:sender',
          publicKeyBase58: 'publicKey',
          blockchainAccountId: 'sender@lto:chainId',
        }, {
          id: 'did:lto:recipient#key',
          type: 'Ed25519VerificationKey2018',
          controller: 'did:lto:recipient',
          publicKeyBase58: 'publicKey',
          blockchainAccountId: 'recipient@lto:chainId',
        }],
        authentication: [
          'did:lto:sender#key',
          'did:lto:recipient#key',
        ],
        assertionMethod: [
          'did:lto:sender#key',
          'did:lto:recipient#key',
        ],
        keyAgreement: [
          'did:lto:recipient#key',
        ],
        capabilityInvocation: [
          'did:lto:sender#key',
        ]
      });
    });

    test('should resolve the identity with MULTIPLE additional verification methods', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async (address: string) => {
        const relationships = 0x0107; // authentication, assertion, key agreement
        const secondRelationships = 0x0113; // authentication, assertion, capabilityDelegation

        return [new VerificationMethod(relationships, address, 'recipient'), new VerificationMethod(secondRelationships, address, 'secondRecipient')];
      });

      const did = await identityService.resolve('sender');

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: 'did:lto:sender',
        verificationMethod: [{
          id: 'did:lto:sender#key',
          type: 'Ed25519VerificationKey2018',
          controller: 'did:lto:sender',
          publicKeyBase58: 'publicKey',
          blockchainAccountId: 'sender@lto:chainId',
        }, {
          id: 'did:lto:recipient#key',
          type: 'Ed25519VerificationKey2018',
          controller: 'did:lto:recipient',
          publicKeyBase58: 'publicKey',
          blockchainAccountId: 'recipient@lto:chainId',
        }, {
          id: 'did:lto:secondRecipient#key',
          type: 'Ed25519VerificationKey2018',
          controller: 'did:lto:secondRecipient',
          publicKeyBase58: 'publicKey',
          blockchainAccountId: 'secondRecipient@lto:chainId',
        }],
        authentication: [
          'did:lto:sender#key',
          'did:lto:recipient#key',
          'did:lto:secondRecipient#key',
        ],
        assertionMethod: [
          'did:lto:sender#key',
          'did:lto:recipient#key',
          'did:lto:secondRecipient#key',
        ],
        keyAgreement: [
          'did:lto:recipient#key',
        ],
        capabilityInvocation: [
          'did:lto:sender#key',
        ],
        capabilityDelegation: [
          'did:lto:secondRecipient#key',
        ]
      });
    });
  });
});
