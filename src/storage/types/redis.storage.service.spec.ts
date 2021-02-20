import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../redis/redis.service';
import { StorageModuleConfig } from '../storage.module';
import { ConfigService } from '../../config/config.service';
import { RedisStorageService } from './redis.storage.service';

describe('RedisStorageService', () => {
  let module: TestingModule;
  let storageService: RedisStorageService;
  let redisService: RedisService;
  let configService: ConfigService;

  function spy() {
    const redisConnection = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      hgetall: jest.fn(),
      hset: jest.fn(),
      zaddWithScore: jest.fn(),
      zrevrangePaginate: jest.fn(),
      zcard: jest.fn(),
      close: jest.fn(),
    };
    const redis = {
      connect: jest.spyOn(redisService, 'connect')
        .mockImplementation(() => redisConnection),
    };

    return { redis, redisConnection };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StorageModuleConfig).compile();
    storageService = module.get<RedisStorageService>(RedisStorageService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);

    jest.spyOn(configService, 'getStorageType').mockImplementation(() => 'redis');

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getValue()', () => {
    test('should get a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      await storageService.getValue(hash);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.get.mock.calls.length).toBe(1);
      expect(spies.redisConnection.get.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('setValue()', () => {
    test('should set a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const transaction = 'fake_transaction';

      await storageService.setValue(hash, transaction);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.set.mock.calls.length).toBe(1);
      expect(spies.redisConnection.set.mock.calls[0][0]).toBe(hash);
      expect(spies.redisConnection.set.mock.calls[0][1]).toBe(transaction);
    });
  });

  describe('delValue()', () => {
    test('should delete a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      await storageService.delValue(hash);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.del.mock.calls.length).toBe(1);
      expect(spies.redisConnection.del.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('getObject()', () => {
    test('should get an object', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      await storageService.getObject(hash);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.hgetall.mock.calls.length).toBe(1);
      expect(spies.redisConnection.hgetall.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('setObject()', () => {
    test('should set an object', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      // const transaction = 'fake_transaction';
      const transaction = {
        id: 'fake_transaction',
        block: '1',
        position: '10',
      };
      await storageService.setObject(hash, transaction);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.hset.mock.calls.length).toBe(3);
      expect(spies.redisConnection.hset.mock.calls[0][0])
        .toBe(hash);
      expect(spies.redisConnection.hset.mock.calls[0][1]).toBe('id');
      expect(spies.redisConnection.hset.mock.calls[0][2]).toBe(transaction.id);

      expect(spies.redisConnection.hset.mock.calls[1][0])
        .toBe(hash);
      expect(spies.redisConnection.hset.mock.calls[1][1]).toBe('block');
      expect(spies.redisConnection.hset.mock.calls[1][2]).toBe(transaction.block);

      expect(spies.redisConnection.hset.mock.calls[2][0])
        .toBe(hash);
      expect(spies.redisConnection.hset.mock.calls[2][1]).toBe('position');
      expect(spies.redisConnection.hset.mock.calls[2][2]).toBe(transaction.position);
    });
  });

  describe('indexTx()', () => {
    test('should index transaction type for address', async () => {
      const spies = spy();

      const type = 'anchor';
      const address = 'fake_address_WITH_CAPS';
      const transaction = 'fake_transaction';
      const timestamp = 1;
      await storageService.indexTx(type, address, transaction, timestamp);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.zaddWithScore.mock.calls.length).toBe(1);
      expect(spies.redisConnection.zaddWithScore.mock.calls[0][0])
        .toBe(`lto:tx:${type}:${address}`);
      expect(spies.redisConnection.zaddWithScore.mock.calls[0][1]).toEqual(String(timestamp));
      expect(spies.redisConnection.zaddWithScore.mock.calls[0][2]).toEqual(transaction);
    });
  });

  describe('getTx()', () => {
    test('should get transaction type for address', async () => {
      const spies = spy();

      const transactions = ['fake_transaction'];
      spies.redisConnection.zrevrangePaginate.mockImplementation(() => transactions);

      const type = 'anchor';
      const address = 'fake_address';
      const limit = 25;
      const offset = 0;
      expect(await storageService.getTx(type, address, limit, offset)).toEqual(transactions);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.zrevrangePaginate.mock.calls.length).toBe(1);
      expect(spies.redisConnection.zrevrangePaginate.mock.calls[0][0])
        .toBe(`lto:tx:${type}:${address}`);
      expect(spies.redisConnection.zrevrangePaginate.mock.calls[0][1]).toBe(limit);
      expect(spies.redisConnection.zrevrangePaginate.mock.calls[0][2]).toBe(offset);
    });
  });

  describe('countTx()', () => {
    test('should count transaction type for address', async () => {
      const spies = spy();

      spies.redisConnection.zcard.mockImplementation(() => 3);

      const type = 'anchor';
      const address = 'fake_address';
      expect(await storageService.countTx(type, address)).toEqual(3);

      expect(spies.redis.connect.mock.calls.length).toBe(1);
      expect(spies.redis.connect.mock.calls[0][0]).toBe('redis://localhost');

      expect(spies.redisConnection.zcard.mock.calls.length).toBe(1);
      expect(spies.redisConnection.zcard.mock.calls[0][0])
        .toBe(`lto:tx:${type}:${address}`);
    });
  });
});
