import { RedisConnection } from './redis.connection';

describe('RedisConnection', () => {
  function spy() {
    const connection = {
      get: jest.fn(),
      set: jest.fn(),
      sadd: jest.fn(),
      quit: jest.fn(),
    };

    return { connection };
  }

  describe('set()', () => {
    test('should set a value to redis', async () => {
      const spies = spy();

      spies.connection.set.mockImplementation(() => 'fake_value');
      const redisConnection = new RedisConnection(spies.connection as any);

      expect(await redisConnection.set('fake_key', 'fake_value')).toBe('fake_value');
      expect(spies.connection.set.mock.calls.length).toBe(1);
      expect(spies.connection.set.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.set.mock.calls[0][1]).toBe('fake_value');
    });
  });

  describe('get()', () => {
    test('should get a value from redis', async () => {
      const spies = spy();

      spies.connection.get.mockImplementation(() => 'fake_value');
      const redisConnection = new RedisConnection(spies.connection as any);

      expect(await redisConnection.get('fake_key')).toBe('fake_value');
      expect(spies.connection.get.mock.calls.length).toBe(1);
      expect(spies.connection.get.mock.calls[0][0]).toBe('fake_key');
    });
  });

  describe('sadd()', () => {
    test('should perform sadd operation on redis', async () => {
      const spies = spy();

      spies.connection.sadd.mockImplementation(() => ['fake_value']);
      const redisConnection = new RedisConnection(spies.connection as any);

      expect(await redisConnection.sadd('fake_key', ['fake_value'])).toEqual(['fake_value']);
      expect(spies.connection.sadd.mock.calls.length).toBe(1);
      expect(spies.connection.sadd.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.sadd.mock.calls[0][1]).toEqual(['fake_value']);
    });
  });

  describe('close()', () => {
    test('should close connection', async () => {
      const spies = spy();

      const redisConnection = new RedisConnection(spies.connection as any);
      await redisConnection.close();

      expect(spies.connection.quit.mock.calls.length).toBe(1);
    });
  });
});
