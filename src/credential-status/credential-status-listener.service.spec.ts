import { Test, TestingModule } from '@nestjs/testing';
import { CredentialStatusModuleConfig } from './credential-status.module';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { CredentialStatusListenerService } from './credential-status-listener.service';
import { CredentialStatus } from './credential-status.model';
import { TrustNetworkService } from '../trust-network/trust-network.service';

describe('CredentialStatusListenerService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let listener: CredentialStatusListenerService;

  const sender = {
    chainId: 'T',
    address: '3N6mZMgGqYn9EVAR2Vbf637iej4fFipECq8',
    ed25519PublicKey: '6wx5nshSAkF7GEgxZRet86XnqSog3k3DzkyCaBKStiUd',
  };

  const transaction = {
    id: 'fake_transaction',
    type: 23,
    sender: sender.address,
    senderPublicKey: sender.ed25519PublicKey,
    senderKeyType: 'ed25519',
    subject: 'test_subject',
    timestamp: 1591290690000,
  } as Transaction;

  function spy() {
    const storage = {
      saveCredentialStatus: jest.spyOn(storageService, 'saveCredentialStatus').mockResolvedValue(undefined),
    };

    const trust = {
      hasRole: jest.spyOn(module.get<TrustNetworkService>(TrustNetworkService), 'hasRole').mockResolvedValue(false),
    };

    return { storage, trust };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(CredentialStatusModuleConfig).compile();

    storageService = module.get<StorageService>(StorageService);
    listener = module.get<CredentialStatusListenerService>(CredentialStatusListenerService);

    await module.init();

    (listener as any).statusIndexing = 'all';
    (listener as any).disputesIndexing = 'all';
  });

  afterEach(async () => {
    await module.close();
  });

  describe('index status', () => {
    it.each([0x10, 0x11, 0x12, 0x13, 0x14, 0x15])('should index statement with type %d', async (type) => {
      const { storage } = spy();

      await listener.index({ transaction: { ...transaction, statementType: type }, blockHeight: 0, position: 1 });

      expect(storage.saveCredentialStatus).toHaveBeenCalled();
      expect(storage.saveCredentialStatus.mock.calls[0][0]).toBe(transaction.subject);
      expect(storage.saveCredentialStatus.mock.calls[0][1]).toEqual(
        new CredentialStatus(type, sender.address, transaction.timestamp),
      );
    });

    it.each([0x10, 0x14])('should not index statement with type %d if not in trust network', async () => {
      const { storage, trust } = spy();

      (listener as any).statusIndexing = 'trust';

      await listener.index({ transaction: { ...transaction, statementType: 0x10 }, blockHeight: 0, position: 1 });

      expect(trust.hasRole).toHaveBeenCalledWith(sender.address);
      expect(storage.saveCredentialStatus).not.toHaveBeenCalled();
    });
  });
});
