// noinspection DuplicatedCode

import { Test, TestingModule } from '@nestjs/testing';
import { DIDModuleConfig } from './did.module';
import { DIDService } from './did.service';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { VerificationMethod } from './verification-method/verification-method.model';
import { StorageService } from '../storage/storage.service';

describe('DIDService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let service: DIDService;
  let verificationMethodService: VerificationMethodService;

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

  const defaultVerificationMethod = new VerificationMethod(0x11f, sender.address, 0);

  function spy() {
    const verificationMethod = {
      save: jest.spyOn(verificationMethodService, 'save').mockResolvedValue(undefined),
      getMethodsFor: jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockResolvedValue([defaultVerificationMethod]),
    };

    const storage = {
      savePublicKey: jest.spyOn(storageService, 'savePublicKey').mockResolvedValue(undefined),
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async (address: string) => {
        if (address === sender.address) return { publicKey: sender.ed25519PublicKey, keyType: 'ed25519' };
        if (address === recipient.address) return { publicKey: recipient.ed25519PublicKey, keyType: 'ed25519' };
        if (address === secondRecipient.address)
          return { publicKey: secondRecipient.secp256k1PublicKey, keyType: 'secp256k1' };

        return null;
      }),
      getAccountCreated: jest.spyOn(storageService, 'getAccountCreated').mockImplementation(async (address: string) => {
        return [sender.address, recipient.address, secondRecipient.address].includes(address)
          ? new Date('2023-01-01T00:00:00Z').getTime()
          : null;
      }),
      getVerificationMethods: jest.spyOn(storageService, 'getVerificationMethods').mockResolvedValue([]),
      getDIDServices: jest.spyOn(storageService, 'getDIDServices').mockResolvedValue([]),
      isDIDDeactivated: jest.spyOn(storageService, 'isDIDDeactivated').mockResolvedValue(undefined),
    };

    return { verificationMethod, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(DIDModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    service = module.get<DIDService>(DIDService);
    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('resolve DID verification methods', () => {
    test('should return an implicit DID document', async () => {
      const spies = spy();
      const did = await service.resolveDocument(sender.address);

      expect(did).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
        ],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);
    });

    test('should return a document with ONE additional verification method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async () => {
          const relationships = 0x0107; // authentication, assertion, key agreement
          return [
            defaultVerificationMethod,
            new VerificationMethod(relationships, recipient.address, new Date('2023-02-01T00:00:00Z').getTime()),
          ];
        });

      const did = await service.resolveDocument(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(2);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${recipient.address}`,
            publicKeyMultibase: `z${recipient.ed25519PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`, `did:lto:${recipient.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`, `did:lto:${recipient.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
          {
            id: `did:lto:${recipient.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${recipient.address}`,
            publicKeyMultibase: `z${recipient.x25519PublicKey}`,
          },
        ],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });
    });

    test('should return a document with reconfigured default verification method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async () => {
          const relationships = 0x0118; // capabilityInvocation, capabilityDelegation
          return [new VerificationMethod(relationships, sender.address, new Date('2023-02-01T00:00:00Z').getTime())];
        });

      const did = await service.resolveDocument(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(1);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        assertionMethod: [],
        authentication: [],
        keyAgreement: [],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });
    });

    test('should return a document with MULTIPLE additional verification methods', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async () => {
          const relationships = 0x107; // authentication, assertion, key agreement
          const secondRelationships = 0x114; // assertion, key agreement, capability delegation

          return [
            defaultVerificationMethod,
            new VerificationMethod(relationships, recipient.address, 0),
            new VerificationMethod(secondRelationships, secondRecipient.address, 0),
          ];
        });

      const did = await service.resolveDocument(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(3);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${recipient.address}`,
            publicKeyMultibase: `z${recipient.ed25519PublicKey}`,
          },
          {
            id: `did:lto:${secondRecipient.address}#sign`,
            type: 'EcdsaSecp256k1VerificationKey2019',
            controller: `did:lto:${secondRecipient.address}`,
            publicKeyMultibase: `z${secondRecipient.secp256k1PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`, `did:lto:${recipient.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`, `did:lto:${recipient.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
          {
            id: `did:lto:${recipient.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${recipient.address}`,
            publicKeyMultibase: `z${recipient.x25519PublicKey}`,
          },
          `did:lto:${secondRecipient.address}#sign`,
        ],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`, `did:lto:${secondRecipient.address}#sign`],
      });
    });

    test('should return a document with a deactivation method', async () => {
      const spies = spy();

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockResolvedValue([
          defaultVerificationMethod,
          new VerificationMethod(0x1108, recipient.address, new Date('2023-02-01T00:00:00Z').getTime()),
        ]);

      const did = await service.resolveDocument(sender.address);

      expect(spies.storage.getPublicKey.mock.calls.length).toBe(2);
      expect(spies.verificationMethod.getMethodsFor.mock.calls.length).toBe(1);

      expect(did).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
        ],
        capabilityInvocation: [
          `did:lto:${sender.address}#sign`,
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${recipient.address}`,
            publicKeyMultibase: `z${recipient.ed25519PublicKey}`,
          },
        ],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });
    });
  });

  describe('resolve DID services', () => {
    let spies: ReturnType<typeof spy>;

    const service1a = {
      id: `did:lto:${sender.address}#lto-relay`,
      type: 'LTORelay',
      serviceEndpoint: 'ampq://relay.lto.network',
    };
    const service1b = {
      id: `did:lto:${sender.address}#lto-relay`,
      type: 'LTORelay',
      serviceEndpoint: 'ampq://relay.example.com',
    };
    const service2 = {
      id: `example.com`,
      type: 'LinkedDomains',
      serviceEndpoint: 'https://example.com',
    };

    beforeEach(() => {
      spies = spy();

      spies.storage.getDIDServices = jest.spyOn(storageService, 'getDIDServices').mockResolvedValue([
        { ...service1a, timestamp: new Date('2023-02-01T00:00:00Z').getTime() },
        { ...service1b, timestamp: new Date('2023-03-01T00:00:00Z').getTime() },
        { ...service2, timestamp: new Date('2023-03-01T00:00:00Z').getTime() },
      ]);

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockImplementation(async () => {
          return [new VerificationMethod(0x100, sender.address, 0)];
        });
    });

    test('should return a DID document with services', async () => {
      const did = await service.resolveDocument(sender.address);

      expect(did).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [service1b, service2],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        authentication: [],
        assertionMethod: [],
        keyAgreement: [],
        capabilityInvocation: [],
        capabilityDelegation: [],
      });

      expect(spies.storage.getDIDServices).toBeCalled();
      expect(spies.storage.getDIDServices.mock.calls[0][0]).toEqual(sender.address);
    });

    test('should return a DID document using a version time', async () => {
      const did = await service.resolveDocument(sender.address, new Date('2023-02-15'));

      expect(did).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [service1a],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        authentication: [],
        assertionMethod: [],
        keyAgreement: [],
        capabilityInvocation: [],
        capabilityDelegation: [],
      });

      expect(spies.storage.getDIDServices).toBeCalled();
      expect(spies.storage.getDIDServices.mock.calls[0][0]).toEqual(sender.address);
    });
  });

  describe('resolve with DID resolution', () => {
    test('should resolve an implicit DID document', async () => {
      spy();

      const resolution = await service.resolve(sender.address);

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');

      expect(resolution.didDocument).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
        ],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });

      expect(resolution.didDocumentMetadata).toEqual({
        created: '2023-01-01T00:00:00Z',
        updated: undefined,
        deactivated: false,
        nextUpdate: undefined,
        lastUpdate: undefined,
      });

      expect(resolution.didResolutionMetadata).toEqual({
        contentType: 'application/did+ld+json',
        did: {
          didString: `did:lto:${sender.address}`,
          method: 'lto',
          methodSpecificId: sender.address,
        },
        networkId: 'T',
      });
    });

    test('should resolve a DID document with an added verification method', async () => {
      const spies = spy();
      const addedMethod = new VerificationMethod(0x0107, recipient.address, new Date('2023-02-01T00:00:00Z').getTime());

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockResolvedValue([defaultVerificationMethod, addedMethod]);
      spies.storage.getVerificationMethods = jest
        .spyOn(storageService, 'getVerificationMethods')
        .mockResolvedValue([defaultVerificationMethod, addedMethod]);

      const resolution = await service.resolve(sender.address);

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');

      expect(resolution.didDocument).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
          {
            id: `did:lto:${recipient.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${recipient.address}`,
            publicKeyMultibase: `z${recipient.ed25519PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`, `did:lto:${recipient.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`, `did:lto:${recipient.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
          {
            id: `did:lto:${recipient.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${recipient.address}`,
            publicKeyMultibase: `z${recipient.x25519PublicKey}`,
          },
        ],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });

      expect(resolution.didDocumentMetadata).toEqual({
        created: '2023-01-01T00:00:00Z',
        updated: '2023-02-01T00:00:00Z',
        deactivated: false,
        nextUpdate: undefined,
        lastUpdate: '2023-02-01T00:00:00Z',
      });

      expect(resolution.didResolutionMetadata).toEqual({
        contentType: 'application/did+ld+json',
        did: {
          didString: `did:lto:${sender.address}`,
          method: 'lto',
          methodSpecificId: sender.address,
        },
        networkId: 'T',
      });
    });

    test('should resolve a DID document with given version time', async () => {
      const versionTime = new Date('2023-01-15T00:00:00.000Z');

      const spies = spy();
      const addedMethod = new VerificationMethod(0x0107, recipient.address, new Date('2023-02-01T00:00:00Z').getTime());

      spies.verificationMethod.getMethodsFor = jest
        .spyOn(verificationMethodService, 'getMethodsFor')
        .mockResolvedValue([defaultVerificationMethod]);
      spies.storage.getVerificationMethods = jest
        .spyOn(storageService, 'getVerificationMethods')
        .mockResolvedValue([defaultVerificationMethod, addedMethod]);

      const resolution = await service.resolve(sender.address, versionTime);

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');

      expect(resolution.didDocument).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
        ],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });

      expect(resolution.didDocumentMetadata).toEqual({
        created: '2023-01-01T00:00:00Z',
        updated: undefined,
        deactivated: false,
        nextUpdate: '2023-02-01T00:00:00Z',
        lastUpdate: '2023-02-01T00:00:00Z',
      });

      expect(resolution.didResolutionMetadata).toEqual({
        contentType: 'application/did+ld+json',
        did: {
          didString: `did:lto:${sender.address}`,
          method: 'lto',
          methodSpecificId: sender.address,
        },
        networkId: 'T',
      });

      expect(spies.verificationMethod.getMethodsFor).toHaveBeenCalledWith(sender.address, versionTime);
    });

    test('should give notFound if DID document is not found', async () => {
      const spies = spy();
      spies.storage.getAccountCreated = jest.spyOn(storageService, 'getAccountCreated').mockResolvedValue(undefined);

      const resolution = await service.resolve(sender.address);

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');
      expect(resolution.didDocument).toEqual({});
      expect(resolution.didDocumentMetadata).toEqual({});
      expect(resolution.didResolutionMetadata).toEqual({ contentType: 'application/did+ld+json', error: 'notFound' });
    });

    test('should give invalidDid', async () => {
      const spies = spy();
      spies.storage.getAccountCreated = jest.spyOn(storageService, 'getAccountCreated').mockResolvedValue(undefined);

      const resolution = await service.resolve('foo');

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');
      expect(resolution.didDocument).toEqual({});
      expect(resolution.didDocumentMetadata).toEqual({});
      expect(resolution.didResolutionMetadata).toEqual({ contentType: 'application/did+ld+json', error: 'invalidDid' });
    });

    test('should resolve if version time is before DID creation', async () => {
      const versionTime = new Date('2022-12-01T00:00:00.000Z');

      const spies = spy();
      spies.storage.getAccountCreated = jest
        .spyOn(storageService, 'getAccountCreated')
        .mockResolvedValue(new Date('2023-01-01T00:00:00.000Z').getTime());

      const resolution = await service.resolve(sender.address, versionTime);

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');
      expect(resolution.didDocument).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [],
      });
      expect(resolution.didDocumentMetadata).toEqual({
        created: '2023-01-01T00:00:00Z',
        deactivated: false,
        nextUpdate: '2023-01-01T00:00:00Z',
      });
      expect(resolution.didResolutionMetadata).toEqual({
        contentType: 'application/did+ld+json',
        did: {
          didString: `did:lto:${sender.address}`,
          method: 'lto',
          methodSpecificId: sender.address,
        },
        networkId: 'T',
      });
    });

    test('should resolve a deactivated DID', async () => {
      const spies = spy();
      spies.storage.isDIDDeactivated = jest
        .spyOn(storageService, 'isDIDDeactivated')
        .mockResolvedValue({ sender: sender.address, timestamp: new Date('2023-02-01T00:00:00.000Z').getTime() });

      const resolution = await service.resolve(sender.address);

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');
      expect(resolution.didDocument).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [],
      });
      expect(resolution.didDocumentMetadata).toEqual({
        created: '2023-01-01T00:00:00Z',
        updated: '2023-02-01T00:00:00Z',
        deactivated: true,
        deactivatedBy: `did:lto:${sender.address}`,
      });
      expect(resolution.didResolutionMetadata).toEqual({
        contentType: 'application/did+ld+json',
        did: {
          didString: `did:lto:${sender.address}`,
          method: 'lto',
          methodSpecificId: sender.address,
        },
        networkId: 'T',
      });
    });

    test('should resolve the DID document is version time is before deactivation', async () => {
      const versionTime = new Date('2023-01-15T00:00:00.000Z');

      const spies = spy();
      spies.storage.isDIDDeactivated = jest
        .spyOn(storageService, 'isDIDDeactivated')
        .mockResolvedValue({ sender: sender.address, timestamp: new Date('2023-02-01T00:00:00.000Z').getTime() });

      const resolution = await service.resolve(sender.address, versionTime);

      expect(resolution['@context']).toEqual('https://w3id.org/did-resolution/v1');

      expect(resolution.didDocument).toEqual({
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1',
          'https://w3id.org/security/suites/secp256k1-2019/v1',
        ],
        id: `did:lto:${sender.address}`,
        service: [],
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.ed25519PublicKey}`,
          },
        ],
        authentication: [`did:lto:${sender.address}#sign`],
        assertionMethod: [`did:lto:${sender.address}#sign`],
        keyAgreement: [
          {
            id: `did:lto:${sender.address}#encrypt`,
            type: 'X25519KeyAgreementKey2019',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.x25519PublicKey}`,
          },
        ],
        capabilityInvocation: [`did:lto:${sender.address}#sign`],
        capabilityDelegation: [`did:lto:${sender.address}#sign`],
      });

      expect(resolution.didDocumentMetadata).toEqual({
        created: '2023-01-01T00:00:00Z',
        updated: undefined,
        deactivated: false,
        nextUpdate: '2023-02-01T00:00:00Z',
        lastUpdate: '2023-02-01T00:00:00Z',
      });

      expect(resolution.didResolutionMetadata).toEqual({
        contentType: 'application/did+ld+json',
        did: {
          didString: `did:lto:${sender.address}`,
          method: 'lto',
          methodSpecificId: sender.address,
        },
        networkId: 'T',
      });
    });
  });
});
