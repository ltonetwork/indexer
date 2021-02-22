import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DidModuleConfig } from './did.module';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../config/config.service';

describe('DidController', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let configService: ConfigService;
  let app: INestApplication;

  function spy() {
    const did = {
      getTransactionByDid: jest.spyOn(storageService, 'getPublicKey')
        .mockReturnValue('AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG'),
    };

    return { did };
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

  describe('GET /did/:url', () => {
    test('should get a did document for the url', async () => {
      const spies = spy();

      const address = '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL';
      const didUrl = `did:lto:${address}`;
      const res = await request(app.getHttpServer())
        .get(`/did/${didUrl}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': `did:lto:${address}`,
        'authentication': [{
          id: `did:lto:${address}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${address}`,
          publicKeyBase58: 'AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG',
        }],
      });

      expect(spies.did.getTransactionByDid.mock.calls.length).toBe(1);
      expect(spies.did.getTransactionByDid.mock.calls[0][0]).toBe(address);
    });
  });
});
