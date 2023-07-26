// noinspection DuplicatedCode

import { Test, TestingModule } from '@nestjs/testing';
import { CredentialStatusModuleConfig } from './credential-status.module';
import { StorageService } from '../storage/storage.service';
import { CredentialStatusService } from './credential-status.service';
import { DIDService } from '../did/did.service';

describe('CredentialStatusService', () => {
  let module: TestingModule;
  let service: CredentialStatusService;
  let storageService: StorageService;
  let didService: DIDService;

  const sender = {
    address: '3N6mZMgGqYn9EVAR2Vbf637iej4fFipECq8',
    keyType: 'ed25519',
    publicKey: '6wx5nshSAkF7GEgxZRet86XnqSog3k3DzkyCaBKStiUd',
  };

  const verifier = {
    address: '3MsE8Jfjkh2zaZ1LCGqaDzB5nAYw5FXhfCx',
    keyType: 'secp256k1',
    publicKey: 'DeAxCdh1pYXpU7h41ieyqTDrTyQmhJWZarqxTtkmJv99',
  };

  const other = {
    address: '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ',
    keyType: 'ed25519',
    publicKey: '6YQpeq9Yeh3VDAuVQvnUQLcUTnEq9hPUwCb9nX3yZHPC',
  };

  function spy() {
    const storage = {
      getCredentialStatus: jest.spyOn(storageService, 'getCredentialStatus').mockResolvedValue([]),
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async (address) => {
        if (address === sender.address) return sender;
        if (address === verifier.address) return verifier;
        return undefined;
      }),
    };

    const did = {
      resolveDocument: jest.spyOn(didService, 'resolveDocument').mockResolvedValue({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:lto:${sender.address}`,
        verificationMethod: [
          {
            id: `did:lto:${sender.address}#sign`,
            type: 'Ed25519VerificationKey2020',
            controller: `did:lto:${sender.address}`,
            publicKeyMultibase: `z${sender.publicKey}`,
          },
        ],
        assertionMethod: [`did:lto:${sender.address}#sign`],
      }),
    };

    return { storage, did };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(CredentialStatusModuleConfig).compile();

    service = module.get<CredentialStatusService>(CredentialStatusService);
    storageService = module.get<StorageService>(StorageService);
    didService = module.get<DIDService>(DIDService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getStatus', () => {
    const expectedStatements = [
      {
        type: 'issue',
        timestamp: '2023-01-01T12:00:00Z',
        signer: {
          id: `did:lto:${sender.address}#sign`,
          type: 'Ed25519VerificationKey2020',
          publicKeyMultibase: `z${sender.publicKey}`,
        },
      },
      {
        type: 'dispute',
        timestamp: '2023-06-01T12:00:00Z',
        signer: {
          id: `did:lto:${verifier.address}#sign`,
          type: 'EcdsaSecp256k1VerificationKey2019',
          publicKeyMultibase: `z${verifier.publicKey}`,
        },
        reason: 'Credentials compromised',
      },
      {
        type: 'suspend',
        timestamp: '2023-06-01T12:03:00Z',
        signer: {
          id: `did:lto:${sender.address}#sign`,
          type: 'Ed25519VerificationKey2020',
          publicKeyMultibase: `z${sender.publicKey}`,
        },
        reason: 'Dispute by trusted party',
      },
      {
        type: 'revoke',
        timestamp: '2023-06-02T12:00:00Z',
        signer: {
          id: `did:lto:${sender.address}#sign`,
          type: 'Ed25519VerificationKey2020',
          publicKeyMultibase: `z${sender.publicKey}`,
        },
      },
    ];

    it('should return a credential status with unknown issuer', async () => {
      const { storage } = spy();

      storage.getCredentialStatus.mockResolvedValueOnce([
        { type: 0x10, timestamp: 1672574400000, sender: sender.address },
        { type: 0x14, timestamp: 1685620800000, sender: verifier.address, reason: 'Credentials compromised' },
        { type: 0x12, timestamp: 1685620980000, sender: sender.address, reason: 'Dispute by trusted party' },
        { type: 0x11, timestamp: 1685707200000, sender: sender.address },
      ]);

      const expected = {
        id: 'foo',
        statements: expectedStatements,
      };

      const result = await service.getStatus('foo');

      expect(result).toEqual(expected);
    });

    it('should return a credential status for revoked credential', async () => {
      const { storage, did } = spy();

      storage.getCredentialStatus.mockResolvedValueOnce([
        { type: 0x10, timestamp: 1672574300000, sender: other.address },
        { type: 0x10, timestamp: 1672574400000, sender: sender.address },
        { type: 0x14, timestamp: 1685620800000, sender: verifier.address, reason: 'Credentials compromised' },
        { type: 0x12, timestamp: 1685620980000, sender: sender.address, reason: 'Dispute by trusted party' },
        { type: 0x11, timestamp: 1685707100000, sender: other.address },
        { type: 0x11, timestamp: 1685707200000, sender: sender.address },
      ]);

      const expected = {
        id: 'foo',
        statements: expectedStatements,
        issued: '2023-01-01T12:00:00Z',
        revoked: '2023-06-02T12:00:00Z',
      };

      const result = await service.getStatus('foo', `did:lto:${sender.address}`);

      expect(result).toEqual(expected);

      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1672574300000));
      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1672574400000));
      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1685620980000));
      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1685707100000));
      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1685707200000));
    });

    it('should return a credential status for suspended credential', async () => {
      const { storage, did } = spy();

      storage.getCredentialStatus.mockResolvedValueOnce([
        { type: 0x10, timestamp: 1672574300000, sender: other.address },
        { type: 0x10, timestamp: 1672574400000, sender: sender.address },
        { type: 0x14, timestamp: 1685620800000, sender: verifier.address, reason: 'Credentials compromised' },
        { type: 0x12, timestamp: 1685620980000, sender: sender.address, reason: 'Dispute by trusted party' },
        { type: 0x10, timestamp: 1685707100000, sender: other.address },
      ]);

      const expected = {
        id: 'foo',
        statements: expectedStatements.slice(0, -1),
        issued: '2023-01-01T12:00:00Z',
        suspended: '2023-06-01T12:03:00Z',
      };

      const result = await service.getStatus('foo', `did:lto:${sender.address}`);

      expect(result).toEqual(expected);

      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1672574300000));
      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1672574400000));
      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1685620980000));
      expect(did.resolveDocument).toHaveBeenCalledWith(`did:lto:${sender.address}`, new Date(1685707100000));
    });
  });
});
