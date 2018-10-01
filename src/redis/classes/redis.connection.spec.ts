import { RedisConnection } from './redis.connection';

describe('RedisConnection', () => {
  function spy() {
    const connection = {
      get: jest.fn(),
      set: jest.fn(),
      zadd: jest.fn(),
      zrange: jest.fn(),
      zcard: jest.fn(),
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

  describe('zadd()', () => {
    test('should perform zadd operation on redis', async () => {
      const spies = spy();

      const redisConnection = new RedisConnection(spies.connection as any);

      await redisConnection.zadd('fake_key', ['fake_value']);
      expect(spies.connection.zadd.mock.calls.length).toBe(1);
      expect(spies.connection.zadd.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.zadd.mock.calls[0][1]).toEqual('fake_value');
    });
  });

  describe('zaddIncr()', () => {
    test('should perform zadd and increment the score on redis', async () => {
      const spies = spy();

      spies.connection.zcard.mockImplementation(() => 3);
      const redisConnection = new RedisConnection(spies.connection as any);

      await redisConnection.zaddIncr('fake_key', ['fake_value']);

      expect(spies.connection.zcard.mock.calls.length).toBe(1);
      expect(spies.connection.zcard.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.zadd.mock.calls.length).toBe(1);
      expect(spies.connection.zadd.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.zadd.mock.calls[0][1]).toBe('3');
      expect(spies.connection.zadd.mock.calls[0][2]).toEqual('fake_value');
    });
  });

  describe('zrange()', () => {
    test('should perform zrange operation on redis', async () => {
      const spies = spy();

      spies.connection.zrange.mockImplementation(() => ['fake_value']);
      const redisConnection = new RedisConnection(spies.connection as any);

      expect(await redisConnection.zrange('fake_key', 0, 25)).toEqual(['fake_value']);
      expect(spies.connection.zrange.mock.calls.length).toBe(1);
      expect(spies.connection.zrange.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.zrange.mock.calls[0][1]).toBe(0);
      expect(spies.connection.zrange.mock.calls[0][2]).toBe(25);
    });
  });

  describe('zrangePaginate()', () => {
    test('should perform zrange operation with paginate support on redis', async () => {
      const spies = spy();

      spies.connection.zrange.mockImplementation(() => ['fake_value']);
      const redisConnection = new RedisConnection(spies.connection as any);

      expect(await redisConnection.zrangePaginate('fake_key', 25, 0)).toEqual(['fake_value']);
      expect(spies.connection.zrange.mock.calls.length).toBe(1);
      expect(spies.connection.zrange.mock.calls[0][0]).toBe('fake_key');
      expect(spies.connection.zrange.mock.calls[0][1]).toBe(0);
      expect(spies.connection.zrange.mock.calls[0][2]).toBe(24);
    });
  });

  describe('zcard()', () => {
    test('should perform zcard operation on redis', async () => {
      const spies = spy();

      spies.connection.zcard.mockImplementation(() => 3);
      const redisConnection = new RedisConnection(spies.connection as any);

      expect(await redisConnection.zcard('fake_key')).toBe(3);
      expect(spies.connection.zcard.mock.calls.length).toBe(1);
      expect(spies.connection.zcard.mock.calls[0][0]).toBe('fake_key');
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
