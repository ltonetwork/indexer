import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TrustNetworkModuleConfig } from './trust-network.module';
import { TrustNetworkService } from './trust-network.service';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

// @todo: make proper tests
describe('TrustNetworkController', () => {
  let module: TestingModule;
  let loggerService: LoggerService;
  let trustNetworkService: TrustNetworkService;
  let configService: ConfigService;
  let app: INestApplication;

  function spy() {
    const trustNetwork = {
      // resolve: jest.spyOn(trustNetworkService, 'resolve').mockImplementation(() => {
      //   return {
      //     id: 'mock-did'
      //   } as any;
      // }),
    };

    const logger = {
      error: jest.spyOn(loggerService, 'error').mockImplementation(() => {}),
    };

    return { trustNetwork, logger };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(TrustNetworkModuleConfig).compile();
    app = module.createNestApplication();
    await app.init();

    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
    trustNetworkService = module.get<TrustNetworkService>(TrustNetworkService);
  });

  afterEach(async () => {
    await module.close();
  });

  // @todo: make tests
  describe('GET /trust/:address', () => {
    test('Temporary test', () => {
      expect(true).toBe(true);
    });
  });
});
