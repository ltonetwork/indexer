import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModuleConfig } from './config.module';
import { ConfigLoaderService } from './config-loader.service';

describe('ConfigLoaderService', () => {
  let module: TestingModule;
  let configService: ConfigLoaderService;

  beforeEach(async () => {
    module = await Test.createTestingModule(ConfigModuleConfig).compile();
    await module.init();

    configService = module.get<ConfigLoaderService>(ConfigLoaderService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('get()', () => {
    test('should return all data from config if no key is given', async () => {
      const config = await configService.get();
      expect(config).toMatchObject({
        env: 'test',
      });
    });

    test('should return only data from config that matches given key', async () => {
      const config = await configService.get('env');
      expect(config).toEqual('test');
    });
  });

  describe('set()', () => {
    test('should set only data in config that matches given key', async () => {
      await configService.set('env', 'foo');
      const config = await configService.get();
      expect(config).toMatchObject({
        env: 'foo',
      });
    });
  });

  describe('has()', () => {
    test('should return whether the key in the config exists', async () => {
      expect(await configService.has('env')).toBe(true);
      expect(await configService.has('foo')).toBe(false);
    });
  });
});
