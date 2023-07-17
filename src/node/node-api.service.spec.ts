import { Test, TestingModule } from '@nestjs/testing';
import { RequestService } from '../common/request/request.service';
import { NodeModuleConfig } from './node.module';
import { NodeApiService } from './node-api.service';
import { AxiosResponse } from 'axios';

describe('NodeApiService', () => {
  let module: TestingModule;
  let nodeApiService: NodeApiService;
  let requestService: RequestService;

  function spy() {
    const request = {
      get: jest.spyOn(requestService, 'get'),
      post: jest.spyOn(requestService, 'post'),
    };

    return { request };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(NodeModuleConfig).compile();
    await module.init();

    nodeApiService = module.get<NodeApiService>(NodeApiService);
    requestService = module.get<RequestService>(RequestService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getNodeAddresses()', () => {
    test('should get all node wallet addresses', async () => {
      const spies = spy();

      const response = { status: 200, data: ['fake_address'] } as AxiosResponse;
      spies.request.get.mockImplementation(() => Promise.resolve(response));

      expect(await nodeApiService.getNodeAddresses()).toBe(response);
      expect(spies.request.get.mock.calls.length).toBe(1);
      expect(spies.request.get.mock.calls[0][0]).toBe('http://localhost:6869/wallet/addresses');
    });
  });

  describe('getUnconfirmedTransactions()', () => {
    test('should get all unconfirmed transactions', async () => {
      const spies = spy();

      const response = {
        status: 200,
        data: [{ id: 'fake_id', type: 12, data: [{ value: 'base64:fake_hash' }] }],
      } as AxiosResponse;
      spies.request.get.mockImplementation(() => Promise.resolve(response));

      expect(await nodeApiService.getUnconfirmedTransactions()).toBe(response);
      expect(spies.request.get.mock.calls.length).toBe(1);
      expect(spies.request.get.mock.calls[0][0]).toBe('http://localhost:6869/transactions/unconfirmed');
    });
  });

  describe('getLastBlock()', () => {
    test('should get last block', async () => {
      const spies = spy();

      const response = { status: 200, data: { id: 'fake_id' } } as AxiosResponse;
      spies.request.get.mockImplementation(() => Promise.resolve(response));

      expect(await nodeApiService.getLastBlock()).toBe(response);
      expect(spies.request.get.mock.calls.length).toBe(1);
      expect(spies.request.get.mock.calls[0][0]).toBe('http://localhost:6869/blocks/last');
    });
  });

  describe('getBlock()', () => {
    test('should get block by id', async () => {
      const spies = spy();

      const response = { status: 200, data: { id: 'fake_id' } } as AxiosResponse;
      spies.request.get.mockImplementation(() => Promise.resolve(response));

      expect(await nodeApiService.getBlock('fake_id')).toBe(response);
      expect(spies.request.get.mock.calls.length).toBe(1);
      expect(spies.request.get.mock.calls[0][0]).toBe('http://localhost:6869/blocks/at/fake_id');
    });
  });

  describe('getBlocks()', () => {
    test('should get blocks by range', async () => {
      const spies = spy();

      const response = { status: 200, data: [{ height: 1 }] } as AxiosResponse;
      spies.request.get.mockImplementation(() => Promise.resolve(response));

      expect(await nodeApiService.getBlocks(1, 2)).toBe(response);
      expect(spies.request.get.mock.calls.length).toBe(1);
      expect(spies.request.get.mock.calls[0][0]).toBe('http://localhost:6869/blocks/seq/1/2');
    });
  });

  describe('getActivationStatus()', () => {
    test('should get the activation status', async () => {
      const spies = spy();

      const mockResponse = { status: 200, data: { height: 12345678 } } as AxiosResponse;
      spies.request.get.mockImplementation(() => Promise.resolve(mockResponse));

      const result = await nodeApiService.getActivationStatus();

      expect(result).toBe(mockResponse);

      expect(spies.request.get.mock.calls.length).toBe(1);
      expect(spies.request.get.mock.calls[0][0]).toBe('http://localhost:6869/activation/status');
    });
  });

  describe('signTransaction()', () => {
    test('should send a sign transaction request', async () => {
      const spies = spy();

      const response = { status: 200 } as AxiosResponse;

      spies.request.post.mockImplementation(() => Promise.resolve(response));

      const transaction = { foo: 'bar' };

      expect(await nodeApiService.signTransaction(transaction)).toBe(response);
      expect(spies.request.post.mock.calls.length).toBe(1);
      expect(spies.request.post.mock.calls[0][0]).toBe('http://localhost:6869/transactions/sign');
      expect(spies.request.post.mock.calls[0][1]).toBe(transaction);
      expect(spies.request.post.mock.calls[0][2]).toEqual({
        headers: {
          'X-Api-Key': 'lt1secretapikey!',
        },
      });
    });
  });

  describe('broadcastTransaction()', () => {
    test('should send a broadcast transaction request', async () => {
      const spies = spy();

      const response = { status: 200 } as AxiosResponse;

      spies.request.post.mockImplementation(() => Promise.resolve(response));

      const transaction = { foo: 'bar' };

      expect(await nodeApiService.broadcastTransaction(transaction)).toBe(response);
      expect(spies.request.post.mock.calls.length).toBe(1);
      expect(spies.request.post.mock.calls[0][0]).toBe('http://localhost:6869/transactions/broadcast');
      expect(spies.request.post.mock.calls[0][1]).toBe(transaction);
      expect(spies.request.post.mock.calls[0][2]).toEqual({
        headers: {
          'X-Api-Key': 'lt1secretapikey!',
        },
      });
    });
  });

  describe('signAndBroadcastTransaction()', () => {
    test('should sign and broadcast a transaction request', async () => {
      const spies = spy();

      const response = { status: 200, data: { some: 'stuff' } } as AxiosResponse;

      spies.request.post.mockImplementation(() => Promise.resolve(response));

      const transaction = { foo: 'bar' };
      const expectedHeaders = {
        headers: { 'X-Api-Key': 'lt1secretapikey!' },
      };

      expect(await nodeApiService.signAndBroadcastTransaction(transaction)).toBe(response);
      expect(spies.request.post).toHaveBeenCalledTimes(2);
      expect(spies.request.post).toHaveBeenNthCalledWith(
        1,
        'http://localhost:6869/transactions/sign',
        transaction,
        expectedHeaders,
      );
      expect(spies.request.post).toHaveBeenNthCalledWith(
        2,
        'http://localhost:6869/transactions/broadcast',
        response.data,
        expectedHeaders,
      );
    });
  });

  describe('getSponsorshipStatus()', () => {
    test('should retrieve the sponsorship status from the node api', async () => {
      const spies = spy();

      const response = { status: 200 } as AxiosResponse;

      spies.request.get.mockImplementation(() => Promise.resolve(response));

      const address = 'some-address';
      const options = {
        headers: {
          'X-Api-Key': 'lt1secretapikey!',
        },
      };

      const result = await nodeApiService.getSponsorshipStatus(address);

      expect(result).toBe(response);
      expect(spies.request.get).toHaveBeenCalledTimes(1);
      expect(spies.request.get).toHaveBeenNthCalledWith(
        1,
        `http://localhost:6869/sponsorship/status/${address}`,
        options,
      );
    });
  });
});
