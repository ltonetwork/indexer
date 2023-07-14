import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { IdentityModuleConfig } from './did.module';
import { DIDService } from './did.service';
import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';

describe('DidController', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let identityService: DIDService;
  let configService: ConfigService;
  let app: INestApplication;

  function spy() {
    const identity = {
      resolve: jest.spyOn(identityService, 'resolve').mockImplementation(() => ({ id: 'mock-did' } as any)),
    };

    const logger = {
      error: jest.spyOn(loggerService, 'error').mockImplementation(() => {}),
    };

    return { identity, logger };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(IdentityModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
    identityService = module.get<DIDService>(DIDService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /identifiers/:url', () => {
    test('should get a identity document for the url', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ id: 'mock-did' });

      expect(spies.logger.error.mock.calls.length).toBe(0);
      expect(spies.identity.resolve.mock.calls.length).toBe(1);
    });

    test('should return not found for unknown identities', async () => {
      const spies = spy();

      spies.identity.resolve = jest.spyOn(identityService, 'resolve').mockImplementation(() => null);

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .send();

      expect(res.status).toBe(404);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ error: 'notFound' });

      expect(spies.logger.error.mock.calls.length).toBe(0);
      expect(spies.identity.resolve.mock.calls.length).toBe(1);
    });

    test('should return error if identity service fails', async () => {
      const spies = spy();

      spies.identity.resolve = jest.spyOn(identityService, 'resolve').mockImplementation(() => {
        throw Error('some bad error');
      });

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .send();

      expect(res.status).toBe(500);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ error: `failed to get DID document '${Error('some bad error')}'` });

      expect(spies.logger.error.mock.calls.length).toBe(1);
      expect(spies.identity.resolve.mock.calls.length).toBe(1);
    });
  });

  describe('GET /identifiers/:url (Accept: application/ld+json;profile="https://w3id.org/did-resolution")', () => {
    test('should get a identity document for the url', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .set('Accept', 'application/ld+json;profile="https://w3id.org/did-resolution"')
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/ld+json; charset=utf-8; profile="https://w3id.org/did-resolution"');
      expect(res.body).toEqual({
        '@context': 'https://w3id.org/did-resolution/v1',
        'didDocument': { id: 'mock-did' },
        'didDocumentMetadata': {},
        'didResolutionMetadata': {},
      });

      expect(spies.logger.error.mock.calls.length).toBe(0);
      expect(spies.identity.resolve.mock.calls.length).toBe(1);
    });

    test('should return not found for unknown identities', async () => {
      const spies = spy();

      spies.identity.resolve = jest.spyOn(identityService, 'resolve').mockImplementation(() => null);

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .set('Accept', 'application/ld+json;profile="https://w3id.org/did-resolution"')
        .send();

      expect(res.status).toBe(404);
      expect(res.header['content-type']).toBe('application/ld+json; charset=utf-8; profile="https://w3id.org/did-resolution"');
      expect(res.body).toEqual({
        '@context': 'https://w3id.org/did-resolution/v1',
        'didDocument': null,
        'didDocumentMetadata': {},
        'didResolutionMetadata': { error: 'notFound' },
      });

      expect(spies.logger.error.mock.calls.length).toBe(0);
      expect(spies.identity.resolve.mock.calls.length).toBe(1);
    });

    test('should return error if identity service fails', async () => {
      const spies = spy();

      spies.identity.resolve = jest.spyOn(identityService, 'resolve').mockImplementation(() => {
        throw Error('some bad error');
      });

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .set('Accept', 'application/ld+json;profile="https://w3id.org/did-resolution"')
        .send();

      expect(res.status).toBe(500);
      expect(res.header['content-type']).toBe('application/ld+json; charset=utf-8; profile="https://w3id.org/did-resolution"');
      expect(res.body).toEqual({
        '@context': 'https://w3id.org/did-resolution/v1',
        'didDocument': null,
        'didDocumentMetadata': {},
        'didResolutionMetadata': { error: 'failed to get DID document', reason: `${Error('some bad error')}` },
      });

      expect(spies.logger.error.mock.calls.length).toBe(1);
      expect(spies.identity.resolve.mock.calls.length).toBe(1);
    });
  });
});
