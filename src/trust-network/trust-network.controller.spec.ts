import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TrustNetworkModuleConfig } from './trust-network.module';
import { TrustNetworkService } from './trust-network.service';

describe('TrustNetworkController', () => {
  let module: TestingModule;
  let trustNetworkService: TrustNetworkService;
  let app: INestApplication;

  function spy() {
    const trustNetwork = {
      getRolesFor: jest.spyOn(trustNetworkService, 'getRolesFor').mockImplementation(async () => {
        return {
          roles: ['authority'],
          issues_roles: [{ type: 100, role: 'university' }],
          issues_authorization: []
        };
      }),
    };

    return { trustNetwork };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TrustNetworkModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    trustNetworkService = module.get<TrustNetworkService>(TrustNetworkService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('GET /trust/:address', () => {
    test('should resolve the roles for a given address', async () => {
      const spies = spy();

      const address = '3N42b1qAmNLq1aJYACf8YQD4RUYBqL1qsmE';
      const res = await request(app.getHttpServer())
        .get(`/trust/${address}`)
        .send();

      expect(spies.trustNetwork.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.trustNetwork.getRolesFor.mock.calls[0][0])
        .toBe(address);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('application/json; charset=utf-8');
      expect(res.body).toEqual({
        roles: ['authority'],
        issues_roles: [{ type: 100, role: 'university' }],
        issues_authorization: []
      });
    });

    test('should return error if service fails', async () => {
      const spies = spy();

      spies.trustNetwork.getRolesFor = jest.spyOn(trustNetworkService, 'getRolesFor').mockRejectedValue('some error');

      const address = '3N42b1qAmNLq1aJYACf8YQD4RUYBqL1qsmE';
      const res = await request(app.getHttpServer())
        .get(`/trust/${address}`)
        .send();

      expect(spies.trustNetwork.getRolesFor.mock.calls.length).toBe(1);
      expect(spies.trustNetwork.getRolesFor.mock.calls[0][0])
        .toBe(address);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'failed to resolve roles'
      });
    });
  });
});
