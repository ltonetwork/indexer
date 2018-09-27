import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis/redis.service';
import { AnchorModuleConfig } from './anchor.module';
import { AnchorStorageService } from './anchor-storage.service';

describe('AnchorStorageService', () => {
  let module: TestingModule;
  let storageService: AnchorStorageService;
  let redisService: RedisService;

  function spy() {
    const redisConnection = {
      get: jest.fn(),
      set: jest.fn(),
      close: jest.fn(),
    };
    const redis = {
      connect: jest.spyOn(redisService, 'connect')
        .mockImplementation(() => redisConnection),
    };

    return { redis, redisConnection };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(AnchorModuleConfig).compile();
    await module.init();

    storageService = module.get<AnchorStorageService>(AnchorStorageService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('saveAnchor()', () => {
    test('should save the anchor', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const transaction = 'fake_transaction';
      await storageService.saveAnchor(hash, transaction);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.set.mock.calls.length).toBe(1);
      expect(spies.redisConnection.set.mock.calls[0][0])
        .toBe(`lto-anchor:anchor:${hash}`);
      expect(spies.redisConnection.set.mock.calls[0][1]).toBe(transaction);
    });
  });

  describe('getProcessingHeight()', () => {
    test('should get processing height', async () => {
      const spies = spy();

      const height = 100;
      spies.redisConnection.get.mockImplementation(() => height);

      expect(await storageService.getProcessingHeight()).toBe(height);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.get.mock.calls.length).toBe(1);
      expect(spies.redisConnection.get.mock.calls[0][0])
        .toBe(`lto-anchor:processing-height`);
    });
  });

  describe('saveProcessingHeight()', () => {
    test('should save processing height', async () => {
      const spies = spy();

      const height = 100;
      await storageService.saveProcessingHeight(height);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.set.mock.calls.length).toBe(1);
      expect(spies.redisConnection.set.mock.calls[0][0])
        .toBe(`lto-anchor:processing-height`);
      expect(spies.redisConnection.set.mock.calls[0][1]).toBe(String(height));
    });
  });
});
