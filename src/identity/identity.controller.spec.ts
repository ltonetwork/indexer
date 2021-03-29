import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DidModuleConfig } from './identity.module';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../config/config.service';

describe('DidController', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let configService: ConfigService;
  let app: INestApplication;

  function spy() {
    const identity = {
      getTransactionByDid: jest.spyOn(storageService, 'getPublicKey')
        .mockReturnValue(Promise.resolve('AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG')),
    };

    return { identity };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(DidModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    storageService = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /identity/:url', () => {
    test('should get a identity document for the url', async () => {
      const spies = spy();

      const address = '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL';
      const identityUrl = `did:lto:${address}`;
      const res = await request(app.getHttpServer())
        .get(`/identities/${identityUrl}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': `did:lto:${address}`,
        'verificationMethod': [{
          id: `identity:lto:${address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `identity:lto:${address}`,
          publicKeyBase58: 'AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG',
        }],
        'authentication': [
          `did:lto:${address}#key`,
        ],
        'assertionMethod': [
          `did:lto:${address}#key`,
        ],
      });

      expect(spies.identity.getTransactionByDid.mock.calls.length).toBe(1);
      expect(spies.identity.getTransactionByDid.mock.calls[0][0]).toBe(address);
    });
  });
});
