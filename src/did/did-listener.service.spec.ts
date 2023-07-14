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
      save: jest.spyOn(verificationMethodService, 'save').mockImplementation(async () => {
      }),
      getMethodsFor: jest.spyOn(verificationMethodService, 'getMethodsFor').mockImplementation(async () => []),
    };

    const storage = {
      savePublicKey: jest.spyOn(storageService, 'savePublicKey').mockImplementation((async () => {
      }) as any),
      getPublicKey: jest.spyOn(storageService, 'getPublicKey').mockImplementation(async (address: string) => {
        if (address === sender.address) return { publicKey: sender.ed25519PublicKey, keyType: 'ed25519' };
        if (address === recipient.address) return { publicKey: recipient.ed25519PublicKey, keyType: 'ed25519' };
        if (address === secondRecipient.address) return {
          publicKey: secondRecipient.ed25519PublicKey,
          keyType: 'ed25519',
        };

        return { publicKey: '', keyType: '' };
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
    listener = module.get<DIDListenerService>(DIDListenerService);
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

  describe('index', () => {
    test('should save public key of transaction sender', async () => {
      const spies = spy();

      await listener.index({ transaction, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.save).toHaveBeenCalledTimes(0);

      expect(spies.storage.savePublicKey).toHaveBeenCalledTimes(1);
      expect(spies.storage.savePublicKey)
        .toHaveBeenNthCalledWith(1, transaction.sender, transaction.senderPublicKey, transaction.senderKeyType);
    });

    test('should save verification method if transaction has "recipient" property', async () => {
      const spies = spy();

      // @ts-ignore
      // noinspection JSConstantReassignment
      transaction.associationType = 0x0107;
      // @ts-ignore
      // noinspection JSConstantReassignment
      transaction.recipient = '3Mv7ajrPLKewkBNqfxwRZoRwW6fziehp7dQ';

      await listener.index({ transaction, blockHeight: 1, position: 0 });

      expect(spies.verificationMethod.save).toHaveBeenCalledTimes(1);
      expect(spies.verificationMethod.save).toHaveBeenNthCalledWith(
        1,
        transaction.associationType,
        transaction.sender,
        transaction.recipient,
      );
    });
  });
});
