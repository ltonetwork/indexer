import { Test, TestingModule } from '@nestjs/testing';
import { RedisModuleConfig } from './redis.module';
import { RedisService } from './redis.service';
import { REDIS } from '../../constants';

describe('RedisService', () => {
  let module: TestingModule;
  let redisService: RedisService;

  const imports = (() => {
    const ioredis = jest.fn().mockImplementation(() => ({
      quit: jest.fn(),
    }));

    return { ioredis };
  })();

  beforeEach(async () => {
    module = await Test.createTestingModule(RedisModuleConfig)
      .overrideProvider(REDIS)
      .useValue(imports.ioredis)
      .compile();
    await module.init();

    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('connect()', () => {
    test('should connect to redis and store the connection for reuse', async () => {
      const redisConnection = await redisService.connect('fake_url');
      expect(imports.ioredis.mock.calls.length).toBe(1);
      expect(imports.ioredis.mock.calls[0][0]).toBe('fake_url');
      expect(redisService.connections).toEqual({
        fake_url: redisConnection,
      });

      const newRedisConnection = await redisService.connect('new_fake_url');
      expect(Object.keys(redisService.connections).length).toBe(2);
      expect(redisService.connections).toEqual({
        fake_url: redisConnection,
        new_fake_url: newRedisConnection,
      });

      expect(await redisService.connect('fake_url')).toBe(redisConnection);
    });
  });

  describe('close()', () => {
    test('should close all stored connections', async () => {
      const first = await redisService.connect('fake_url');
      const second = await redisService.connect('new_fake_url');

      expect(Object.keys(redisService.connections).length).toBe(2);

      const spyFirst = jest.spyOn(first, 'quit');
      const spySecond = jest.spyOn(second, 'quit');

      await redisService.close();

      expect(Object.keys(redisService.connections).length).toBe(0);

      expect(spyFirst.mock.calls.length).toBe(1);
      expect(spySecond.mock.calls.length).toBe(1);
    });
  });
});
