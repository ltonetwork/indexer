import { LeveldbConnection } from './leveldb.connection';

describe('LeveldbConnection', () => {
  function spy() {
    const connection = {
      get: jest.fn(),
      put: jest.fn(),
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

  describe('del()', () => {
    test.skip('should del a value from leveldb', async () => {});
  });

  describe('zaddWithScore()', () => {
    test.skip('should add a value with a score to leveldb', async () => {});
  });

  describe('paginate()', () => {
    test.skip('shouldload values paginated from leveldb', async () => {});
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
