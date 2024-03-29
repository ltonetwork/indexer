import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DIDModuleConfig } from './did.module';
import { DIDService } from './did.service';
import { LoggerService } from '../common/logger/logger.service';

describe('DIDController', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let identityService: DIDService;
  let app: INestApplication;

  function spy() {
    const identity = {
      resolve: jest.spyOn(identityService, 'resolve').mockResolvedValue({
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: { id: 'mock-did' },
        didDocumentMetadata: {},
        didResolutionMetadata: {},
      } as any),
      resolveDocument: jest.spyOn(identityService, 'resolveDocument').mockResolvedValue({ id: 'mock-did' } as any),
    };

    const logger = {
      error: jest.spyOn(loggerService, 'error').mockReturnValue(undefined),
    };

    return { identity, logger };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(DIDModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    loggerService = module.get<LoggerService>(LoggerService);
    identityService = module.get<DIDService>(DIDService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /identifiers/:url', () => {
    test('should get a identity document for the url', async () => {
      const spies = spy();

      const res = await request(app.getHttpServer()).get('/identifiers/did:lto:sender').send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ id: 'mock-did' });

      expect(spies.logger.error).not.toHaveBeenCalled();
      expect(spies.identity.resolveDocument).toHaveBeenCalledWith('did:lto:sender', undefined);
    });

    test('should return not found for unknown identities', async () => {
      const spies = spy();

      spies.identity.resolveDocument = jest.spyOn(identityService, 'resolveDocument').mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get('/identifiers/did:lto:sender').send();

      expect(res.status).toBe(404);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ error: 'notFound' });

      expect(spies.logger.error).not.toHaveBeenCalled();
      expect(spies.identity.resolveDocument).toHaveBeenCalledWith('did:lto:sender', undefined);
    });

    test('should return error if identity service fails', async () => {
      const spies = spy();

      spies.identity.resolveDocument = jest
        .spyOn(identityService, 'resolveDocument')
        .mockRejectedValue(new Error('some bad error'));

      const res = await request(app.getHttpServer()).get('/identifiers/did:lto:sender').send();

      expect(res.status).toBe(500);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ error: `failed to get DID document '${Error('some bad error')}'` });

      expect(spies.logger.error).toHaveBeenCalledTimes(1);
      expect(spies.identity.resolveDocument).toHaveBeenCalledWith('did:lto:sender', undefined);
    });

    test('should pass the version time', async () => {
      const spies = spy();

      const versionTime = new Date('2023-01-01T00:00:00.999Z');

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender?versionTime=2023-01-01T00:00:00Z')
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({ id: 'mock-did' });

      expect(spies.logger.error).not.toHaveBeenCalled();
      expect(spies.identity.resolveDocument).toHaveBeenCalledWith('did:lto:sender', versionTime);
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
      expect(res.header['content-type']).toBe(
        'application/ld+json; charset=utf-8; profile="https://w3id.org/did-resolution"',
      );
      expect(res.body).toEqual({
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: { id: 'mock-did' },
        didDocumentMetadata: {},
        didResolutionMetadata: {},
      });

      expect(spies.logger.error).not.toHaveBeenCalled();
      expect(spies.identity.resolve).toHaveBeenCalledWith('did:lto:sender', undefined);
    });

    test('should return not found for unknown identities', async () => {
      const spies = spy();

      spies.identity.resolve = jest.spyOn(identityService, 'resolve').mockResolvedValue({
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: {},
        didDocumentMetadata: {},
        didResolutionMetadata: { error: 'notFound' },
      } as any);

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .set('Accept', 'application/ld+json;profile="https://w3id.org/did-resolution"')
        .send();

      expect(res.status).toBe(404);
      expect(res.header['content-type']).toBe(
        'application/ld+json; charset=utf-8; profile="https://w3id.org/did-resolution"',
      );
      expect(res.body).toEqual({
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: {},
        didDocumentMetadata: {},
        didResolutionMetadata: { error: 'notFound' },
      });

      expect(spies.logger.error).not.toHaveBeenCalled();
      expect(spies.identity.resolve).toHaveBeenCalledWith('did:lto:sender', undefined);
    });

    test('should return error if identity service fails', async () => {
      const spies = spy();

      spies.identity.resolve = jest.spyOn(identityService, 'resolve').mockRejectedValue(new Error('some bad error'));

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender')
        .set('Accept', 'application/ld+json;profile="https://w3id.org/did-resolution"')
        .send();

      expect(res.status).toBe(500);
      expect(res.header['content-type']).toBe(
        'application/ld+json; charset=utf-8; profile="https://w3id.org/did-resolution"',
      );
      expect(res.body).toEqual({
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: {},
        didDocumentMetadata: {},
        didResolutionMetadata: { error: 'internalError', reason: `${Error('some bad error')}` },
      });

      expect(spies.logger.error).toHaveBeenCalledTimes(1);
      expect(spies.identity.resolve).toHaveBeenCalledWith('did:lto:sender', undefined);
    });

    test('should pass the version time', async () => {
      const spies = spy();

      const versionTime = new Date('2023-01-01T00:00:00.999Z');

      const res = await request(app.getHttpServer())
        .get('/identifiers/did:lto:sender?versionTime=2023-01-01T00:00:00Z')
        .set('Accept', 'application/ld+json;profile="https://w3id.org/did-resolution"')
        .send();

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe(
        'application/ld+json; charset=utf-8; profile="https://w3id.org/did-resolution"',
      );
      expect(res.body).toEqual({
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: { id: 'mock-did' },
        didDocumentMetadata: {},
        didResolutionMetadata: {},
      });

      expect(spies.logger.error).not.toHaveBeenCalled();
      expect(spies.identity.resolve).toHaveBeenCalledWith('did:lto:sender', versionTime);
    });
  });
});
