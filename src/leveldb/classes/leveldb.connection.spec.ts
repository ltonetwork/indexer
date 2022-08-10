import { LeveldbConnection } from './leveldb.connection';

describe('LeveldbConnection', () => {
  function spy() {
    const connection = {
      get: jest.fn(async () => ''),
      put: jest.fn(async () => ''),
      del: jest.fn(async () => 1),
      batch: jest.fn(async () => ''),
      zadd: jest.fn(async () => ''),
      zrange: jest.fn(async () => ''),
      zcard: jest.fn(async () => ''),
      close: jest.fn(async () => ''),
    };

    return { connection };
  }

  describe('set()', () => {
    test('should set a value to leveldb', async () => {
      const spies = spy();

      spies.connection.put.mockImplementation(async () => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.set('fake_key', 'fake_value')).toBe('fake_value');
      await levelDBConnection.flush();

      expect(spies.connection.batch.mock.calls.length).toBe(1);
      expect(spies.connection.batch.mock.calls[0]).toEqual([[
          {key: 'fake_key', value: 'fake_value', type: 'put'},
      ]]);
    });
  });

  describe('add()', () => {
    test('should set a value to leveldb if it doesn\'t exist', async () => {
      const spies = spy();

      spies.connection.get.mockRejectedValue(new Error('key not found in database'));
      spies.connection.put.mockImplementation(async () => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.add('fake_key', 'fake_value')).toBe('fake_value');
      await levelDBConnection.flush();

      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0]).toEqual(['fake_key']);

      expect(spies.connection.batch.mock.calls.length).toBe(1);
      expect(spies.connection.batch.mock.calls[0]).toEqual([[
          {key: 'fake_key', value: 'fake_value', type: 'put'},
      ]]);
    });

    test('should not set a value to leveldb if it already exists', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(async () => 'current_value');
      spies.connection.put.mockImplementation(async () => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.add('fake_key', 'fake_value')).toBe('current_value');
      await levelDBConnection.flush();

      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0]).toEqual(['fake_key']);

      expect(spies.connection.batch.mock.calls.length).toBe(0);
    });
  });

  describe('get()', () => {
    test('should get a value from leveldb', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(async () => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.get('fake_key')).toBe('fake_value');
      await levelDBConnection.flush();

      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0]).toEqual(['fake_key']);
    });

    test('should catch "key not found in database" error and return empty object', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(async () => {
        throw new Error('NotFoundError: Key not found in database [lto:anchor:some-anchor]');
      });

      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      const result = await levelDBConnection.get('fake_key');

      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0]).toEqual(['fake_key']);

      expect(result).toEqual(null);
    });

    test('should rethrow errors other than "key not found in database"', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(async () => {
        throw new Error('some really bad error here...');
      });

      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      try {
        await levelDBConnection.get('fake_key');
      } catch (error) {
        expect(error).toEqual(new Error('some really bad error here...'));

        expect(spies.connection.get.mock.calls.length).toBe(1);
        expect(spies.connection.get.mock.calls[0]).toEqual(['fake_key']);
      }
    });
  });

  describe('mget()', () => {
    test('should get multiple values from leveldb', async () => {
      const spies = spy();
      const values = ['fake_value1', 'fake_value2'];

      spies.connection.get.mockImplementation(async () => values.shift());
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.mget(['fake_key1', 'fake_key2'])).toEqual(['fake_value1', 'fake_value2']);
      expect(spies.connection.get.mock.calls.length).toBe(2);
      expect(spies.connection.get.mock.calls[0]).toEqual(['fake_key1']);
      expect(spies.connection.get.mock.calls[1]).toEqual(['fake_key2']);
    });
  });

  describe('del()', () => {
    test('should delete a value from leveldb', async () => {
      const spies = spy();

      spies.connection.del.mockImplementation(async () => 1);
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.del('fake_key')).toBe(1);
      await levelDBConnection.flush();

      expect(spies.connection.batch.mock.calls.length).toBe(1);
      expect(spies.connection.batch.mock.calls[0]).toEqual([[
          {key: 'fake_key', value: null, type: 'del'},
      ]]);
    });
  });

  describe('incr()', () => {
    test('should increment a value in leveldb', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(async () => '42');
      spies.connection.put.mockImplementation(async () => '43');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.incr('fake_key')).toBe('43');
      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0]).toEqual(['fake_key']);

      await levelDBConnection.flush();
      expect(spies.connection.batch.mock.calls.length).toBe(1);
      expect(spies.connection.batch.mock.calls[0]).toEqual([[
          {key: 'fake_key', value: '43', type: 'put'},
      ]]);
    });
  });

  describe('zaddWithScore()', () => {
    test.skip('should add a value with a score to leveldb', async () => {});
  });

  describe('paginate()', () => {
    test.skip('should load values paginated from leveldb', async () => {});
  });

  describe('countTx()', () => {
    test.skip('should load a count from leveldb', async () => {});
  });

  describe('close()', () => {
    test('should close connection', async () => {
      const spies = spy();

      const levelDBConnection = new LeveldbConnection(spies.connection as any);
      await levelDBConnection.close();

      expect(spies.connection.close.mock.calls.length).toBe(1);
    });
  });
});
