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

    test('getNodeUrl()', async () => {
      expect(configService.getNodeUrl()).toBe('http://localhost:6869');
    });

    test('getNodeStartingBlock()', async () => {
      expect(configService.getNodeStartingBlock()).toBe(1);
    });

    test('getApiSecret()', async () => {
      expect(configService.getApiSecret()).toBe('lt1secretapikey!');
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

    test('getLoggerConsole()', async () => {
      expect(configService.getLoggerConsole()).toEqual({ level: 'info' });
    });

    test('getLoggerCombined()', async () => {
      expect(configService.getLoggerCombined()).toEqual({ level: 'info' });
    });
  });
});
