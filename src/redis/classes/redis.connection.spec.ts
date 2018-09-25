import { RedisConnection } from './redis.connection';

describe('RedisConnection', () => {
  function spy() {
    const connection = {
      get: jest.fn(),
      set: jest.fn(),
      disconnect: jest.fn(),
    };

    return { connection };
  }

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

  describe('close()', () => {
    test('should close connection', async () => {
      const spies = spy();

      const redisConnection = new RedisConnection(spies.connection as any);
      await redisConnection.close();

      expect(spies.connection.disconnect.mock.calls.length).toBe(1);
    });
  });
});
