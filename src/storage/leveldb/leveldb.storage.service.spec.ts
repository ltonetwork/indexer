import { Test, TestingModule } from '@nestjs/testing';
import { StorageModuleConfig } from '../storage.module';
import { LeveldbService } from '../../common/leveldb/leveldb.service';
import { LeveldbStorageService } from './leveldb.storage.service';

describe('LevelDbStorageService', () => {
  let module: TestingModule;
  let storageService: LeveldbStorageService;
  let leveldbService: LeveldbService;

  function spy() {
    const leveldbConnection = {
      get: jest.fn(),
      mget: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      zaddWithScore: jest.fn(),
      paginate: jest.fn(),
      zcount: jest.fn(),
      close: jest.fn(),
      incrCount: jest.fn(),
    };
    const leveldb = {
      connect: jest.spyOn(leveldbService, 'connect').mockResolvedValue(leveldbConnection as any),
    };

    return { leveldb, leveldbConnection };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(StorageModuleConfig).compile();
    storageService = module.get<LeveldbStorageService>(LeveldbStorageService);
    leveldbService = module.get<LeveldbService>(LeveldbService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getValue()', () => {
    test('should get a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      spies.leveldbConnection.get.mockImplementation(() => 'fake_value');
      expect(await storageService.getValue(hash)).toBe('fake_value');

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.get.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.get.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('getMultipleValues()', () => {
    test('should get multiple value', async () => {
      const spies = spy();

      spies.leveldbConnection.mget.mockImplementation(() => ['fake_value1', 'fake_value2']);
      expect(await storageService.getMultipleValues(['key1', 'key2'])).toEqual(['fake_value1', 'fake_value2']);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.mget.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.mget.mock.calls[0][0]).toEqual(['key1', 'key2']);
    });
  });

  describe('setValue()', () => {
    test('should set a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const transaction = 'fake_transaction';

      await storageService.setValue(hash, transaction);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.set.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.set.mock.calls[0][0]).toBe(hash);
      expect(spies.leveldbConnection.set.mock.calls[0][1]).toBe(transaction);
    });
  });

  describe('delValue()', () => {
    test('should delete a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      await storageService.delValue(hash);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.del.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.del.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('incrValue()', () => {
    test('should increment a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      await storageService.incrValue(hash);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.incr.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.incr.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('getObject()', () => {
    test('should get an object', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      await storageService.getObject(hash);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.get.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.get.mock.calls[0][0]).toBe(hash);
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

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.set.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.set.mock.calls[0][0]).toBe(hash);
      expect(spies.leveldbConnection.set.mock.calls[0][1]).toBe(JSON.stringify(transaction));
    });
  });

  describe('addToSortedSet()', () => {
    test('should add a value to a sorted set', async () => {
      const spies = spy();

      const key = 'foo';
      const value = 'fake_transaction';
      const score = 1;
      await storageService.addToSortedSet(key, value, score);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.zaddWithScore.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.zaddWithScore.mock.calls[0][0]).toBe(key);
      expect(spies.leveldbConnection.zaddWithScore.mock.calls[0][1]).toEqual(String(score));
      expect(spies.leveldbConnection.zaddWithScore.mock.calls[0][2]).toEqual(value);
    });
  });

  describe('getSortedSet()', () => {
    test('should get items from a sorted set', async () => {
      const spies = spy();

      const transactions = ['fake_transaction'];
      spies.leveldbConnection.paginate.mockResolvedValue(transactions);

      const key = 'foo';
      const limit = 25;
      const offset = 0;
      expect(await storageService.getSortedSet(key, limit, offset)).toEqual(transactions);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.paginate.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.paginate.mock.calls[0][0]).toBe(key);
      expect(spies.leveldbConnection.paginate.mock.calls[0][1]).toBe(limit);
      expect(spies.leveldbConnection.paginate.mock.calls[0][2]).toBe(offset);
    });
  });

  describe('countSortedSet()', () => {
    test('should count items in a sorted set', async () => {
      const spies = spy();

      spies.leveldbConnection.zcount.mockResolvedValue(3);

      const key = 'foo';
      expect(await storageService.countSortedSet(key)).toEqual(3);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('lto-index');

      expect(spies.leveldbConnection.zcount.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.zcount.mock.calls[0][0]).toBe(key);
    });
  });
});
