import { Test, TestingModule } from '@nestjs/testing';
import { CredentialStatusModuleConfig } from './credential-status.module';
import { StorageService } from '../storage/storage.service';
import { CredentialStatusService } from './credential-status.service';

describe('CredentialStatusService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let service: CredentialStatusService;

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

  function spy() {
    const storage = {
      getCredentialStatus: jest.spyOn(storageService, 'getCredentialStatus').mockResolvedValue([]),
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async (address) => {
        if (address === sender.address) return sender;
        if (address === verifier.address) return verifier;
        return undefined;
      }),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(CredentialStatusModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    service = module.get<CredentialStatusService>(CredentialStatusService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getStatus', () => {
    it('should return a credential status', async () => {
      const { storage } = spy();

      storage.getCredentialStatus.mockResolvedValueOnce([
        { type: 0x10, timestamp: 1672574400000, sender: sender.address },
        { type: 0x14, timestamp: 1685620800000, sender: verifier.address, reason: 'Credentials compromised' },
        { type: 0x12, timestamp: 1685620980000, sender: sender.address, reason: 'Dispute by trusted party' },
        { type: 0x11, timestamp: 1685707200000, sender: sender.address },
      ]);

      const expected = {
        id: 'foo',
        statements: [
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
        ],
      };

      const result = await service.getStatus('foo');

      expect(result).toEqual(expected);
    });
  });
});
