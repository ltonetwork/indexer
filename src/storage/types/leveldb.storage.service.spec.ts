import { Test, TestingModule } from '@nestjs/testing';
import { StorageModuleConfig } from '../storage.module';
import { LeveldbService } from '../../leveldb/leveldb.service';
import { LeveldbStorageService } from './leveldb.storage.service';

describe('LevelDbStorageService', () => {
  let module: TestingModule;
  let storageService: LeveldbStorageService;
  let leveldbService: LeveldbService;

  function spy() {
    const leveldbConnection = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      zaddWithScore: jest.fn(),
      paginate: jest.fn(),
      countTx: jest.fn(),
      close: jest.fn(),
    };
    const leveldb = {
      connect: jest.spyOn(leveldbService, 'connect')
        .mockImplementation(() => leveldbConnection),
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

      await storageService.getValue(hash);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

      expect(spies.leveldbConnection.get.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.get.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('setValue()', () => {
    test('should set a value', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';
      const transaction = 'fake_transaction';

      await storageService.setValue(hash, transaction);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

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
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

      expect(spies.leveldbConnection.del.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.del.mock.calls[0][0]).toBe(hash);
    });
  });

  describe('getObject()', () => {
    test('should get an object', async () => {
      const spies = spy();

      const hash = '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE';

      await storageService.getObject(hash);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

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
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

      expect(spies.leveldbConnection.set.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.set.mock.calls[0][0]).toBe(hash);
      expect(spies.leveldbConnection.set.mock.calls[0][1]).toBe(JSON.stringify(transaction));
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

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

      expect(spies.leveldbConnection.zaddWithScore.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.zaddWithScore.mock.calls[0][0])
        .toBe(`lto-anchor:tx:${type}:${address}`);
      expect(spies.leveldbConnection.zaddWithScore.mock.calls[0][1]).toEqual(String(timestamp));
      expect(spies.leveldbConnection.zaddWithScore.mock.calls[0][2]).toEqual(transaction);
    });
  });

  describe('getTx()', () => {
    test('should get transaction type for address', async () => {
      const spies = spy();

      const transactions = ['fake_transaction'];
      spies.leveldbConnection.paginate.mockResolvedValue(transactions);

      const type = 'anchor';
      const address = 'fake_address';
      const limit = 25;
      const offset = 0;
      expect(await storageService.getTx(type, address, limit, offset)).toEqual(transactions);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

      expect(spies.leveldbConnection.paginate.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.paginate.mock.calls[0][0])
        .toBe(`lto-anchor:tx:${type}:${address}`);
      expect(spies.leveldbConnection.paginate.mock.calls[0][1]).toBe(limit);
      expect(spies.leveldbConnection.paginate.mock.calls[0][2]).toBe(offset);
    });
  });

  describe('countTx()', () => {
    test('should count transaction type for address', async () => {
      const spies = spy();

      spies.leveldbConnection.countTx.mockResolvedValue(3);

      const type = 'anchor';
      const address = 'fake_address';
      expect(await storageService.countTx(type, address)).toEqual(3);

      expect(spies.leveldb.connect.mock.calls.length).toBe(1);
      expect(spies.leveldb.connect.mock.calls[0][0]).toBe('anchor-db');

      expect(spies.leveldbConnection.countTx.mock.calls.length).toBe(1);
      expect(spies.leveldbConnection.countTx.mock.calls[0][0])
        .toBe(`lto-anchor:tx:${type}:${address}`);
    });
  });
});
