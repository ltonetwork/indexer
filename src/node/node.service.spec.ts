import { Test, TestingModule } from '@nestjs/testing';
import { NodeModuleConfig } from './node.module';
import { NodeService } from './node.service';
import { NodeApiService } from './node-api.service';

describe('NodeService', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let nodeApiService: NodeApiService;

  function spy() {
    const api = {
      getNodeAddresses: jest.spyOn(nodeApiService, 'getNodeAddresses'),
      getUnconfirmedTransactions: jest.spyOn(nodeApiService, 'getUnconfirmedTransactions'),
      getLastBlock: jest.spyOn(nodeApiService, 'getLastBlock'),
      getBlock: jest.spyOn(nodeApiService, 'getBlock'),
      sendTransaction: jest.spyOn(nodeApiService, 'sendTransaction'),
    };

    return { api };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(NodeModuleConfig).compile();
    await module.init();

    nodeService = module.get<NodeService>(NodeService);
    nodeApiService = module.get<NodeApiService>(NodeApiService);
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
});
