import redis from 'ioredis';

export class RedisConnection {
  constructor(
    private connection: redis.Redis,
  ) {
  }

  async set(key: redis.KeyType, value: string): Promise<string> {
    return this.connection.set(key, value);
  }

  async get(key: redis.KeyType): Promise<string> {
    return this.connection.get(key);
  }

  async sadd(key: redis.KeyType, members: any[]): Promise<string> {
    return this.connection.sadd(key, members);
  }

  async close() {
    await this.connection.quit();
  }
}
