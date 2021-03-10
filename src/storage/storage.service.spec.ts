import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis/redis.service';
import { StorageModuleConfig } from './storage.module';
import { StorageService } from './storage.service';
import { ConfigService } from '../config/config.service';
import { RedisStorageService } from './types/redis.storage.service';

describe('StorageService', () => {
  let module: TestingModule;
  let storageService: StorageService;
  let redisStorageService: RedisStorageService;
  let redisService: RedisService;
  let configService: ConfigService;

  function spy() {
    const redisConnection = {
      close: jest.fn(),
    };
    const redis = {
      connect: jest.spyOn(redisService, 'connect')
        // @ts-ignore
        .mockImplementation(async () => redisConnection),
    };

    return { redis, redisConnection };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StorageModuleConfig).compile();
    storageService = module.get<StorageService>(StorageService);
    redisStorageService = module.get<RedisStorageService>(RedisStorageService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);

    // @ts-ignore
    jest.spyOn(configService, 'getStorageType').mockImplementation(() => 'redis');
    await module.init();

    spy();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('saveAnchor()', () => {
    test('should save the anchor', async () => {
      const setObject = jest.spyOn(redisStorageService, 'setObject').mockImplementation(() => Promise.resolve());

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      // const transaction = 'fake_transaction';
      const transaction = {
        id: 'fake_transaction',
        block: '1',
        position: '10',
      };
      await storageService.saveAnchor(hash, transaction);

      expect(setObject.mock.calls.length).toBe(1);
      expect(setObject.mock.calls[0][0]).toBe(`lto:anchor:${hash.toLowerCase()}`);
      expect(setObject.mock.calls[0][1]).toEqual(transaction);
    });
  });

  describe('indexTx()', () => {
    test('should index transaction type for address', async () => {
      const transaction = 'fake_transaction';
      const indexTx = jest.spyOn(redisStorageService, 'indexTx').mockImplementation(() => Promise.resolve());

      const type = 'anchor';
      const address = 'fake_address_WITH_CAPS';
      const timestamp = 1;
      await storageService.indexTx(type, address, transaction, timestamp);

      expect(indexTx.mock.calls.length).toBe(1);
      expect(indexTx.mock.calls[0][0]).toBe(type);
      expect(indexTx.mock.calls[0][1]).toBe(address);
      expect(indexTx.mock.calls[0][2]).toBe(transaction);
      expect(indexTx.mock.calls[0][3]).toBe(timestamp);
    });
  });

  describe('getTx()', () => {
    test('should get transaction type for address', async () => {
      const transactions = ['fake_transaction'];
      const getTx = jest.spyOn(redisStorageService, 'getTx').mockImplementation(async () => transactions);

      const type = 'anchor';
      const address = 'fake_address';
      const limit = 25;
      const offset = 0;
      expect(await storageService.getTx(type, address, limit, offset)).toEqual(transactions);

      expect(getTx.mock.calls.length).toBe(1);
      expect(getTx.mock.calls[0][0]).toBe(type);
      expect(getTx.mock.calls[0][1]).toBe(address);
      expect(getTx.mock.calls[0][2]).toBe(limit);
      expect(getTx.mock.calls[0][3]).toBe(offset);
    });
  });

  describe('countTx()', () => {
    test('should count transaction type for address', async () => {
      const countTx = jest.spyOn(redisStorageService, 'countTx').mockImplementation(async () => 3);

      const type = 'anchor';
      const address = 'fake_address';
      expect(await storageService.countTx(type, address)).toEqual(3);

      expect(countTx.mock.calls.length).toBe(1);
      expect(countTx.mock.calls[0][0]).toBe(type);
      expect(countTx.mock.calls[0][1]).toBe(address);
    });
  });

  describe('incrTxStats()', () => {
    test('should increment stats for transaction type', async () => {
      const incrValue = jest.spyOn(redisStorageService, 'incrValue').mockImplementation(async () => {});

      const type = 'anchor';
      const day = 18600;
      await storageService.incrTxStats(type, day);

      expect(incrValue.mock.calls.length).toBe(1);
      expect(incrValue.mock.calls[0][0]).toBe(`lto:txstats:${type}:${day}`);
    });
  });

  describe('getTxStats()', () => {
    test('should increment stats for transaction type', async () => {
      const getMultipleValues = jest.spyOn(redisStorageService, 'getMultipleValues')
        .mockImplementation(async () => ['300', '329', '402', '293']);

      const type = 'anchor';
      expect(await storageService.getTxStats(type, 18600, 18603))
        .toEqual([
          {period: '2020-12-04 00:00:00', count: 300},
          {period: '2020-12-05 00:00:00', count: 329},
          {period: '2020-12-06 00:00:00', count: 402},
          {period: '2020-12-07 00:00:00', count: 293},
        ]);

      expect(getMultipleValues.mock.calls.length).toBe(1);
      expect(getMultipleValues.mock.calls[0][0]).toEqual([
        `lto:txstats:${type}:18600`,
        `lto:txstats:${type}:18601`,
        `lto:txstats:${type}:18602`,
        `lto:txstats:${type}:18603`,
      ]);
    });
  });

  describe('getProcessingHeight()', () => {
    test('should get processing height', async () => {
      const getValue = jest.spyOn(redisStorageService, 'getValue').mockImplementation(async () => '100');

      expect(await storageService.getProcessingHeight()).toBe(100);

      expect(getValue.mock.calls.length).toBe(1);
      expect(getValue.mock.calls[0][0])
        .toBe(`lto:processing-height`);
    });
  });

  describe('saveProcessingHeight()', () => {
    test('should save processing height', async () => {
      const height = 100;
      const setValue = jest.spyOn(redisStorageService, 'setValue').mockImplementation(async () => {});

      await storageService.saveProcessingHeight(height);

      expect(setValue.mock.calls.length).toBe(1);
      expect(setValue.mock.calls[0][0])
        .toBe(`lto:processing-height`);
      expect(setValue.mock.calls[0][1]).toBe(String(height));
    });
  });
});
