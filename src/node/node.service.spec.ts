import { Test, TestingModule } from '@nestjs/testing';
import { NodeModuleConfig } from './node.module';
import { NodeService } from './node.service';
import { NodeApiService } from './node-api.service';
import { StorageService } from '../storage/storage.service';

describe('NodeService', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let nodeApiService: NodeApiService;
  let storageService: StorageService;

  function spy() {
    const fakeTransaction = {
      id: 'fake_transaction',
      blockHeight: '1',
      position: '0'
    };

    const node = {
      getNodeWallet: jest.spyOn(nodeService, 'getNodeWallet'),
      createAnchorTransaction: jest.spyOn(nodeService, 'createAnchorTransaction'),
      getUnconfirmedAnchor: jest.spyOn(nodeService, 'getUnconfirmedAnchor'),
    };

    const storage = {
      getAnchor: jest.spyOn(storageService, 'getAnchor')
        .mockImplementation(() => fakeTransaction),
    };

    const api = {
      getNodeAddresses: jest.spyOn(nodeApiService, 'getNodeAddresses'),
      getUnconfirmedTransactions: jest.spyOn(nodeApiService, 'getUnconfirmedTransactions'),
      getLastBlock: jest.spyOn(nodeApiService, 'getLastBlock'),
      getBlock: jest.spyOn(nodeApiService, 'getBlock'),
      sendTransaction: jest.spyOn(nodeApiService, 'sendTransaction'),
    };

    return { api, node, storage };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(NodeModuleConfig).compile();
    await module.init();

    nodeService = module.get<NodeService>(NodeService);
    nodeApiService = module.get<NodeApiService>(NodeApiService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getNodeWallet()', () => {
    test('should get the node wallet address', async () => {
      const spies = spy();

      const response = { status: 200, data: ['fake_address'] };
      spies.api.getNodeAddresses.mockImplementation(() => Promise.resolve(response));

      expect(await nodeService.getNodeWallet()).toBe(response.data[0]);
      expect(spies.api.getNodeAddresses.mock.calls.length).toBe(1);
    });
  });

  describe('getUnconfirmedAnchor()', () => {
    test('should get the unconfirmed anchor', async () => {
      const spies = spy();

      const response = { status: 200, data: [{ id: 'fake_id', type: 12, data: [{ value: 'base64:fake_hash' }] }] };
      spies.api.getUnconfirmedTransactions.mockImplementation(() => Promise.resolve(response));

      expect(await nodeService.getUnconfirmedAnchor('fake_hash')).toBe(response.data[0].id);
      expect(spies.api.getUnconfirmedTransactions.mock.calls.length).toBe(1);
    });
  });

  describe('getLastBlockHeight()', () => {
    test('should get last block height', async () => {
      const spies = spy();

      const response = { status: 200, data: { height: 1 } };
      spies.api.getLastBlock.mockImplementation(() => Promise.resolve(response));

      expect(await nodeService.getLastBlockHeight()).toBe(response.data.height - 1);
      expect(spies.api.getLastBlock.mock.calls.length).toBe(1);
    });
  });

  describe('getBlock()', () => {
    test('should get block by id', async () => {
      const spies = spy();

      const response = { status: 200, data: { id: 'fake_id' } };
      spies.api.getBlock.mockImplementation(() => Promise.resolve(response));

      expect(await nodeService.getBlock('fake_id')).toBe(response.data);
      expect(spies.api.getBlock.mock.calls.length).toBe(1);
    });
  });

  describe('createAnchorTransaction()', () => {
    test('should create anchor transaction', async () => {
      const spies = spy();

      const response = { status: 200, data: { id: 'fake_id' } };
      spies.api.sendTransaction.mockImplementation(() => Promise.resolve(response));

      expect(await nodeService.createAnchorTransaction('fake_sender', 'fake_hash')).toEqual('fake_id');
      expect(spies.api.sendTransaction.mock.calls.length).toBe(1);
    });
  });

  describe('anchor()', () => {
    test('should anchor hash with given encoding', async () => {
      const spies = spy();
      spies.node.getNodeWallet.mockImplementation(() => 'fake_wallet');
      spies.node.createAnchorTransaction.mockImplementation(() => 'fake_transaction');
      spies.node.getUnconfirmedAnchor.mockImplementation(() => 'fake_transaction');

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const encoding = 'hex';
      const chainpoint = {
        '@context': 'https://w3id.org/chainpoint/v2',
        'anchors': [
          {
            sourceId: 'fake_transaction',
            type: 'LTODataTransaction',
          },
        ],
        'targetHash': hash,
        'type': 'ChainpointSHA256v2',
      };

      expect(await nodeService.anchor(hash, encoding)).toEqual(chainpoint);

      expect(spies.node.getNodeWallet.mock.calls.length).toBe(1);
      expect(spies.node.createAnchorTransaction.mock.calls.length).toBe(1);
      expect(spies.node.createAnchorTransaction.mock.calls[0][0]).toBe('fake_wallet');
      expect(spies.node.createAnchorTransaction.mock.calls[0][1]).toBe('3yMApqCuCjXDWPrbjfR5mjCPTHqFG8Pux1TxQrEM35jj');
    });
  });

  describe('getTransactionByHash()', () => {
    test('should get transaction by hash', async () => {
      const spies = spy();
      spies.node.getNodeWallet.mockImplementation(() => 'fake_wallet');
      spies.node.createAnchorTransaction.mockImplementation(() => 'fake_transaction');
      spies.node.getUnconfirmedAnchor.mockImplementation(() => 'fake_transaction');

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const chainpoint = {
        '@context': 'https://w3id.org/chainpoint/v2',
        'anchors': [
          {
            sourceId: 'fake_transaction',
            type: 'LTODataTransaction',
          },
        ],
        block: {
          height: '1'
        },
        transaction: {
          position: '0'
        },
        'targetHash': hash,
        'type': 'ChainpointSHA256v2',
      };

      expect(await nodeService.getTransactionByHash(hash)).toEqual(chainpoint);

      expect(spies.storage.getAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.getAnchor.mock.calls[0][0]).toBe(hash);

      expect(spies.node.getUnconfirmedAnchor.mock.calls.length).toBe(0);
    });

    test('should get transaction by hash by looking in unconfirmed transactions', async () => {
      const spies = spy();
      spies.node.getNodeWallet.mockImplementation(() => 'fake_wallet');
      spies.node.createAnchorTransaction.mockImplementation(() => 'fake_transaction');
      spies.node.getUnconfirmedAnchor.mockImplementation(() => 'fake_transaction');

      spies.storage.getAnchor.mockImplementation(() => undefined);

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const chainpoint = {
        '@context': 'https://w3id.org/chainpoint/v2',
        'anchors': [
          {
            sourceId: 'fake_transaction',
            type: 'LTODataTransaction',
          },
        ],
        'targetHash': hash,
        'type': 'ChainpointSHA256v2',
      };

      expect(await nodeService.getTransactionByHash(hash)).toEqual(chainpoint);

      expect(spies.storage.getAnchor.mock.calls.length).toBe(1);
      expect(spies.storage.getAnchor.mock.calls[0][0]).toBe(hash);

      expect(spies.node.getUnconfirmedAnchor.mock.calls.length).toBe(1);
      expect(spies.node.getUnconfirmedAnchor.mock.calls[0][0]).toBe('LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=');
    });
  });
});
