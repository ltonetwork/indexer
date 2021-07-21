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

    test('getLtoApiKey()', async () => {
      expect(configService.getLtoApiKey()).toBe('');
    });

    test('getNodeUrl()', async () => {
      expect(configService.getNodeUrl()).toBe('http://localhost:6869');
    });

    test('getNodeStartingBlock()', async () => {
      expect(configService.getNodeStartingBlock()).toBe(1);
    });

    test('getNodeRestartSync()', () => {
      expect(configService.getNodeRestartSync()).toBeFalsy();
    });

    test('getApiSecret()', async () => {
      expect(configService.getApiSecret()).toBe('lt1secretapikey!');

      configService.getLtoApiKey = jest.fn(() => 'global');
      expect(configService.getApiSecret()).toBe('global');
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

    test('getLoggerConsole()', async () => {
      // @ts-ignore
      configService.getLoggerGlobal = jest.fn(() => '');
      expect(configService.getLoggerConsole()).toEqual({ level: 'info' });

      configService.getLoggerGlobal = jest.fn(() => ({ level: 'debug' }));
      expect(configService.getLoggerConsole()).toEqual({ level: 'debug' });
    });

    test('getLoggerCombined()', async () => {
      // @ts-ignore
      configService.getLoggerGlobal = jest.fn(() => '');
      expect(configService.getLoggerCombined()).toEqual({ level: 'info' });

      configService.getLoggerGlobal = jest.fn(() => ({ level: 'debug' }));
      expect(configService.getLoggerCombined()).toEqual({ level: 'debug' });
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
