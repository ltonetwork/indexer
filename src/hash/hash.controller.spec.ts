import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HashModuleConfig } from './hash.module';
import { NodeService } from '../node/node.service';
import { ConfigService } from '../config/config.service';

describe('HashController', () => {
  let module: TestingModule;
  let nodeService: NodeService;
  let configService: ConfigService;
  let app: INestApplication;

  const chainpoint = {
    '@context': 'https://w3id.org/chainpoint/v2',
    'type': 'ChainpointSHA256v2',
    'targetHash': 'bdf8c9bdf076d6aff0292a1c9448691d2ae283f2ce41b045355e2c8cb8e85ef2',
    'anchors': [
      {
        type: 'LTO',
        sourceId: '3JzVxKUyREwKAVYoEUTeUTv9xQh17TqAjtR',
      },
    ],
  };

  function spy() {
    const hash = {
      anchor: jest.spyOn(nodeService, 'anchor')
        .mockImplementation(async () => chainpoint),
      getTransactionByHash: jest.spyOn(nodeService, 'getTransactionByHash')
        .mockImplementation(async () => chainpoint),
    };

    return { hash };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(HashModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    nodeService = module.get<NodeService>(NodeService);
    configService = module.get<ConfigService>(ConfigService);
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
      expect(res.body).toEqual({ chainpoint });

      expect(spies.hash.anchor.mock.calls.length).toBe(1);
      expect(spies.hash.anchor.mock.calls[0][0]).toBe(hash);
      expect(spies.hash.anchor.mock.calls[0][1]).toBe('hex');
    });

    test('should anchor hash to the blockchain when auth is enabled and given', async () => {
      const spies = spy();
      const token = '8DeKltC3dOjTNlv1EbXjCYIsOhypz4u245LypJeSdu5lES33VnqI3sy5OznLuA4x';
      jest.spyOn(configService, 'getAuthToken').mockImplementation(() => token);

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const res = await request(app.getHttpServer())
        .post('/hash')
        .set('Authorization', `Bearer ${token}`)
        .send({ hash });

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ chainpoint });

      expect(spies.hash.anchor.mock.calls.length).toBe(1);
      expect(spies.hash.anchor.mock.calls[0][0]).toBe(hash);
      expect(spies.hash.anchor.mock.calls[0][1]).toBe('hex');
    });

    test('should return an unauthorized when auth is enabled and not given', async () => {
      jest.spyOn(configService, 'getAuthToken').mockImplementation(() => '8DeKltC3dOjTNlv1EbXjCYIsOhypz4u245LypJeSdu5lES33VnqI3sy5OznLuA4x');

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const res = await request(app.getHttpServer())
        .post('/hash')
        .send({ hash });

      expect(res.status).toBe(401);
    });

    test('should return an unauthorized when auth is enabled and a wrong one given', async () => {
      jest.spyOn(configService, 'getAuthToken').mockImplementation(() => '8DeKltC3dOjTNlv1EbXjCYIsOhypz4u245LypJeSdu5lES33VnqI3sy5OznLuA4x');

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const res = await request(app.getHttpServer())
        .post('/hash')
        .set('Authorization', `Bearer test`)
        .send({ hash });

      expect(res.status).toBe(401);
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
      expect(res.body).toEqual({ chainpoint });

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
      expect(res.body).toEqual({ chainpoint });

      expect(spies.hash.getTransactionByHash.mock.calls.length).toBe(1);
      expect(spies.hash.getTransactionByHash.mock.calls[0][0]).toBe(hash);
    });
  });
});
