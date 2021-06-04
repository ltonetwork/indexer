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
      getVerificationMethods: jest.spyOn(storageService, 'getVerificationMethods')
        .mockReturnValue(Promise.resolve([`{"sender":"3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL","recipient":"3NCCqjZvtvx6ymbYzfEy7xrh7TEbPYGwxWN","relationships":259}`]))
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

      const sender = '3JuijVBB7NCwCz2Ae5HhCDsqCXzeBLRTyeL';
      const recipient = '3NCCqjZvtvx6ymbYzfEy7xrh7TEbPYGwxWN';
      const identityUrl = `did:lto:${sender}`;
      const res = await request(app.getHttpServer())
        .get(`/identities/${identityUrl}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': `did:lto:${sender}`,
        'verificationMethod': [{
          id: `did:lto:${sender}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${sender}`,
          publicKeyBase58: 'AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG',
          blockchainAccountId: `${sender}@lto:L`,
        }, {
          id: `did:lto:${recipient}#key`,
          type: 'Ed25519VerificationKey2018',
          controller: `did:lto:${recipient}`,
          publicKeyBase58: 'AVXUh6yvPG8XYqjbUgvKeEJQDQM7DggboFjtGKS8ETRG',
          blockchainAccountId: `${recipient}@lto:T`,
        }],
        'authentication': [
          `did:lto:${recipient}#key`
        ],
        'assertionMethod': [
          `did:lto:${recipient}#key`
        ],
      });

      expect(spies.identity.getTransactionByDid.mock.calls.length).toBe(1);
      expect(spies.identity.getTransactionByDid.mock.calls[0][0]).toBe(sender);
      expect(spies.identity.getVerificationMethods.mock.calls.length).toBe(1);
      expect(spies.identity.getVerificationMethods.mock.calls[0][0]).toBe(sender);
    });
  });
});
