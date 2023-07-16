import { Test, TestingModule } from '@nestjs/testing';
import { IdentityModuleConfig } from './did.module';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
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

  const secondRecipient = {
    chainId: 'T',
    address: '3MsE8Jfjkh2zaZ1LCGqaDzB5nAYw5FXhfCx',
    secp256k1PublicKey: 'DeAxCdh1pYXpU7h41ieyqTDrTyQmhJWZarqxTtkmJv99',
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
    };

    const storage = {
      savePublicKey: jest.spyOn(storageService, 'savePublicKey').mockResolvedValue(undefined),
    };

    return { verificationMethod, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(IdentityModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    listener = module.get<DIDListenerService>(DIDListenerService);
    verificationMethodService = module.get<VerificationMethodService>(VerificationMethodService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index public key', () => {
    test('should save public key of transaction sender', async () => {
      const spies = spy();

      await listener.index({ transaction, blockHeight: 1, position: 0 });

      expect(spies.storage.savePublicKey).toHaveBeenCalledTimes(1);
      expect(spies.storage.savePublicKey).toHaveBeenCalledWith(
        sender.address,
        sender.ed25519PublicKey,
        'ed25519',
        transaction.timestamp,
      );
    });
  });

  describe('index register tx', () => {
    test('should save public key of transaction sender', async () => {
      const tx = {
        ...transaction,
        type: 20,
        accounts: [
          { keyType: 'ed25519', publicKey: recipient.ed25519PublicKey },
          { keyType: 'secp256k1', publicKey: secondRecipient.secp256k1PublicKey },
        ],
      } as Transaction;

      const spies = spy();

      await listener.index({ transaction: tx, blockHeight: 1, position: 0 });

      expect(spies.storage.savePublicKey).toHaveBeenCalledTimes(3);
      expect(spies.storage.savePublicKey).toHaveBeenCalledWith(
        sender.address,
        sender.ed25519PublicKey,
        'ed25519',
        transaction.timestamp,
      );
      expect(spies.storage.savePublicKey).toHaveBeenCalledWith(
        recipient.address,
        recipient.ed25519PublicKey,
        'ed25519',
        transaction.timestamp,
      );
      expect(spies.storage.savePublicKey).toHaveBeenCalledWith(
        secondRecipient.address,
        secondRecipient.secp256k1PublicKey,
        'secp256k1',
        transaction.timestamp,
      );
    });
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
});
