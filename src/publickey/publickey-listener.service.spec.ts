import { Test, TestingModule } from '@nestjs/testing';
import { PublickeyModuleConfig } from './publickey.module';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../interfaces/transaction.interface';
import { PublickeyListenerService } from './publickey-listener.service';

describe('PublicKeyListenerService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let listener: PublickeyListenerService;

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
    const storage = {
      savePublicKey: jest.spyOn(storageService, 'savePublicKey').mockResolvedValue(undefined),
    };

    return { storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(PublickeyModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    listener = module.get<PublickeyListenerService>(PublickeyListenerService);

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
});
