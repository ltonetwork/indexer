import { Test, TestingModule } from '@nestjs/testing';
import { DIDModuleConfig } from './did.module';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../interfaces/transaction.interface';
import { DIDListenerService } from './did-listener.service';

describe('DIDListenerService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let listener: DIDListenerService;
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

  const transaction = {
    id: 'fake_transaction',
    type: 1,
    sender: sender.address,
    senderPublicKey: sender.ed25519PublicKey,
    senderKeyType: 'ed25519',
    timestamp: 1591290690000,
  } as Transaction;

  function spy() {
    const verificationMethod = {
      save: jest.spyOn(verificationMethodService, 'save').mockResolvedValue(undefined),
      revoke: jest.spyOn(verificationMethodService, 'revoke').mockResolvedValue(undefined),
      hasDeactivateCapability: jest
        .spyOn(verificationMethodService, 'hasDeactivateCapability')
        .mockImplementation(async (account: string, sender: string) => account === sender),
    };

    const storage = {
      deactivateDID: jest.spyOn(storageService, 'deactivateDID').mockResolvedValue(undefined),
      saveDIDService: jest.spyOn(storageService, 'saveDIDService').mockResolvedValue(undefined),
    };

    return { verificationMethod, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(DIDModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    listener = module.get<DIDListenerService>(DIDListenerService);
    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index issue', () => {
    test('should save verification method', async () => {
      const tx = {
        ...transaction,
        type: 16,
        associationType: 0x100,
        data: [
          { key: 'authentication', type: 'boolean', value: true },
          { key: 'assertionMethod', type: 'boolean', value: true },
        ],
        expires: new Date('2030-01-01').getTime(),
      } as Transaction;

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.save).toHaveBeenCalledTimes(1);
      expect(spies.verificationMethod.save).toHaveBeenCalledWith(
        tx.associationType,
        tx.sender,
        tx.recipient,
        { authentication: true, assertionMethod: true },
        tx.timestamp,
        tx.expires,
      );
    });

    test('should ignore other associations', async () => {
      const tx = {
        ...transaction,
        type: 16,
        associationType: 0x200,
      };

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.save).not.toHaveBeenCalled();
    });
  });

  describe('index revoke', () => {
    test('should revoke verification method', async () => {
      const tx = {
        ...transaction,
        type: 17,
        associationType: 0x100,
      } as Transaction;

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.revoke).toHaveBeenCalledTimes(1);
      expect(spies.verificationMethod.revoke).toHaveBeenCalledWith(0x100, tx.sender, tx.recipient, tx.timestamp);
    });

    test('should ignore other associations', async () => {
      const tx = {
        ...transaction,
        type: 17,
        associationType: 0x200,
      };

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.revoke).not.toHaveBeenCalled();
    });
  });

  describe('index deactivate', () => {
    test('should deactivate DID of own address', async () => {
      const tx = {
        ...transaction,
        type: 23,
        statementType: 0x120,
      } as Transaction;

      spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(verificationMethodService.hasDeactivateCapability).toHaveBeenCalledWith(
        tx.sender,
        tx.sender,
        tx.timestamp,
      );
      expect(storageService.deactivateDID).toHaveBeenCalledWith(tx.sender, tx.sender, tx.timestamp);
    });

    test('should deactivate DID of other address if granted deactivate capability', async () => {
      const tx = {
        ...transaction,
        type: 23,
        statementType: 0x121,
        recipient: recipient.address,
      } as Transaction;

      const spies = spy();
      spies.verificationMethod.hasDeactivateCapability = jest
        .spyOn(verificationMethodService, 'hasDeactivateCapability')
        .mockResolvedValue(true);

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(verificationMethodService.hasDeactivateCapability).toHaveBeenCalledWith(
        tx.recipient,
        tx.sender,
        tx.timestamp,
      );
      expect(storageService.deactivateDID).toHaveBeenCalledWith(tx.recipient, tx.sender, tx.timestamp);
    });

    test('should NOT deactivate DID of other address if not granted deactivate capability', async () => {
      const tx = {
        ...transaction,
        type: 23,
        statementType: 0x121,
        recipient: recipient.address,
      } as Transaction;

      const spies = spy();
      spies.verificationMethod.hasDeactivateCapability = jest
        .spyOn(verificationMethodService, 'hasDeactivateCapability')
        .mockResolvedValue(false);

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(verificationMethodService.hasDeactivateCapability).toHaveBeenCalledWith(
        tx.recipient,
        tx.sender,
        tx.timestamp,
      );
      expect(storageService.deactivateDID).not.toHaveBeenCalled();
    });
  });

  describe('index services', () => {
    test('should save a DID service', async () => {
      const tx = {
        ...transaction,
        type: 12,
        data: [
          { key: `did:service:foo`, type: 'string', value: '{"type":"Foo","serviceEndpoint":"https://example.com"}' },
        ],
      } as Transaction;

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.storage.saveDIDService).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveDIDService).toHaveBeenCalledWith(tx.sender, {
        id: `did:lto:${sender.address}#foo`,
        type: 'Foo',
        serviceEndpoint: 'https://example.com',
        timestamp: tx.timestamp,
      });
    });

    test('should save a DID service with a custom id', async () => {
      const tx = {
        ...transaction,
        type: 12,
        data: [
          {
            key: `did:service:foo`,
            type: 'string',
            value: '{"id":"foo_bar","type":"Foo","serviceEndpoint":"https://example.com"}',
          },
        ],
      } as Transaction;

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.storage.saveDIDService).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveDIDService).toHaveBeenCalledWith(tx.sender, {
        id: 'foo_bar',
        type: 'Foo',
        serviceEndpoint: 'https://example.com',
        timestamp: tx.timestamp,
      });
    });

    test('should save a removed DID service', async () => {
      const tx = {
        ...transaction,
        type: 12,
        data: [{ key: `did:service:foo`, type: 'boolean', value: false }],
      } as Transaction;

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.storage.saveDIDService).toHaveBeenCalledTimes(1);
      expect(spies.storage.saveDIDService).toHaveBeenCalledWith(tx.sender, {
        id: `did:lto:${sender.address}#foo`,
        timestamp: tx.timestamp,
      });
    });

    test('should skip other data entries', async () => {
      const tx = {
        ...transaction,
        type: 12,
        data: [{ key: `hello`, type: 'string', value: 'world' }],
      } as Transaction;

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.storage.saveDIDService).not.toHaveBeenCalled();
    });
  });
});
