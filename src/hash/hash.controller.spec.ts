import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HashModuleConfig } from './hash.module';
import { NodeService } from '../node/node.service';

describe('HashController', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let app: INestApplication;

  function spy() {
    const hash = {
      anchor: jest.spyOn(nodeService, 'anchor')
        .mockImplementation(() => ({ type: 'ChainpointSHA256v2' })),
      getTransactionByHash: jest.spyOn(nodeService, 'getTransactionByHash')
        .mockImplementation(() => ({ type: 'ChainpointSHA256v2' })),
    };

    return { hash };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(HashModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    nodeService = module.get<NodeService>(NodeService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('POST /hash', () => {
    test('should anchor hash to the blockchain', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const res = await request(app.getHttpServer())
        .post('/hash')
        .send({ hash });

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ chainpoint: { type: 'ChainpointSHA256v2' } });

      expect(spies.hash.anchor.mock.calls.length).toBe(1);
      expect(spies.hash.anchor.mock.calls[0][0]).toBe(hash);
      expect(spies.hash.anchor.mock.calls[0][1]).toBe('hex');
    });
  });

  describe('GET /hash/:hash', () => {
    test('should get chainpoint that matches the hash', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const res = await request(app.getHttpServer())
        .get(`/hash/${hash}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ chainpoint: { type: 'ChainpointSHA256v2' } });

      expect(spies.hash.getTransactionByHash.mock.calls.length).toBe(1);
      expect(spies.hash.getTransactionByHash.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('GET /hash/:hash/encoding/:encoding', () => {
    test('should get chainpoint that matches the hash and encoding', async () => {
      const spies = spy();

      const encoding = 'hex';
      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const res = await request(app.getHttpServer())
        .get(`/hash/${hash}/encoding/${encoding}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ chainpoint: { type: 'ChainpointSHA256v2' } });

      expect(spies.hash.getTransactionByHash.mock.calls.length).toBe(1);
      expect(spies.hash.getTransactionByHash.mock.calls[0][0]).toBe(hash);
    });
  });
});
