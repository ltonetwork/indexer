import { LeveldbConnection } from './leveldb.connection';

describe('LeveldbConnection', () => {
  function spy() {
    const connection = {
      get: jest.fn(),
      put: jest.fn(),
      del: jest.fn(),
      batch: jest.fn(),
      zadd: jest.fn(),
      zrange: jest.fn(),
      zcard: jest.fn(),
      close: jest.fn(),
    };

    return { connection };
  }

  describe('set()', () => {
    test('should set a value to leveldb', async () => {
      const spies = spy();

      spies.connection.put.mockImplementation(() => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.set('fake_key', 'fake_value')).toBe('fake_value');
      expect(spies.connection.put.mock.calls.length).toBe(1);
      expect(spies.connection.put.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.put.mock.calls[0][1]).toBe('fake_value');
    });
  });

  describe('add()', () => {
    test('should set a value to leveldb if it doesn\'t exist', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(() => '');
      spies.connection.put.mockImplementation(() => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.add('fake_key', 'fake_value')).toBe('fake_value');

      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0][0]).toBe('fake_key');

      expect(spies.connection.put.mock.calls.length).toBe(1);
      expect(spies.connection.put.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.put.mock.calls[0][1]).toBe('fake_value');
    });

    test('should not set a value to leveldb if it already exists', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(() => 'current_value');
      spies.connection.put.mockImplementation(() => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.add('fake_key', 'fake_value')).toBe('current_value');

      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0][0]).toBe('fake_key');

      expect(spies.connection.put.mock.calls.length).toBe(0);
    });
  });

  describe('get()', () => {
    test('should get a value from leveldb', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(() => 'fake_value');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.get('fake_key')).toBe('fake_value');
      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0][0]).toBe('fake_key');
    });
  });

  describe('mget()', () => {
    test('should get multiple values from leveldb', async () => {
      const spies = spy();
      const values = ['fake_value1', 'fake_value2'];

      spies.connection.get.mockImplementation(async () => values.shift());
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.mget(['fake_key1', 'fake_key2']))
        .toEqual(['fake_value1', 'fake_value2']);
      expect(spies.connection.get.mock.calls.length).toBe(2);
      expect(spies.connection.get.mock.calls[0][0]).toBe('fake_key1');
      expect(spies.connection.get.mock.calls[1][0]).toBe('fake_key2');
    });
  });

  describe('del()', () => {
    test('should delete a value from leveldb', async () => {
      const spies = spy();

      spies.connection.del.mockImplementation(() => 1);
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.del('fake_key')).toBe(1);
      expect(spies.connection.del.mock.calls.length).toBe(1);
      expect(spies.connection.del.mock.calls[0][0]).toBe('fake_key');
    });
  });

  describe('incr()', () => {
    test('should increment a value in leveldb', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(() => '42');
      spies.connection.put.mockImplementation(() => '43');
      const levelDBConnection = new LeveldbConnection(spies.connection as any);

      expect(await levelDBConnection.incr('fake_key')).toBe('43');
      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.put.mock.calls.length).toBe(1);
      expect(spies.connection.put.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.put.mock.calls[0][1]).toBe('43');
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
