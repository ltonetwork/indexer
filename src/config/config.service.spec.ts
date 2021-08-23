import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModuleConfig } from './config.module';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let module: TestingModule;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule(ConfigModuleConfig).compile();
    await module.init();

    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('get config', () => {
    test('getEnv()', async () => {
      expect(configService.getEnv()).toBe('test');
    });

    test('getNodeApiKey()', async () => {
      expect(configService.getNodeApiKey()).toBe('lt1secretapikey!');
    });

    test('getNodeUrl()', async () => {
      expect(configService.getNodeUrl()).toBe('http://localhost:6869');
    });

    test('getStartingBlock()', async () => {
      expect(configService.getStartingBlock()).toBe(1);
    });

    test('getRestartSync()', () => {
      expect(configService.getRestartSync()).toBeFalsy();
    });

    test('getRedisClient()', async () => {
      expect(configService.getRedisClient()).toBe('redis://localhost');
    });

    test('getRedisUrl()', async () => {
      expect(configService.getRedisUrl()).toBe('redis://localhost');
    });

    test('getRedisCluster()', async () => {
      expect(configService.getRedisCluster()).toBe('');
    });

    test('getMonitorInterval()', async () => {
      expect(configService.getMonitorInterval()).toBe(5000);
    });

    test('getLoggerLevel()', async () => {
      expect(configService.getLoggerLevel()).toEqual('OFF');
    });

    test('getRoles()', () => {
      expect(configService.getRoles()).toStrictEqual({
        root: {
          description: 'The root role'
        }
      });
    });
  });
});
