import redis from 'ioredis';

/**
 * @todo What is the point of this wrapper class? Can't we just use `Redis|Cluster`?
 */
export class RedisConnection {
  constructor(
    private connection: redis.Redis|redis.Cluster,
  ) {
  }

  async set(key: redis.KeyType, value: string): Promise<string> {
    return this.connection.set(key, value);
  }

  async hset(key: redis.KeyType, field: string, value: any): Promise<number> {
    return this.connection.hset(key, field, value);
  }

  async hsetnx(key: redis.KeyType, field: string, value: any): Promise<number> {
    return this.connection.hsetnx(key, field, value);
  }

  async hgetall(key: redis.KeyType): Promise<object> {
    return this.connection.hgetall(key);
  }

  async get(key: redis.KeyType): Promise<string> {
    return this.connection.get(key);
  }

  async mget(keys: string[]): Promise<string[]> {
    return this.connection.mget(keys);
  }

  async del(key: redis.KeyType): Promise<number|void> {
    return this.connection.del(key);
  }

  async incr(key: redis.KeyType): Promise<number> {
    return this.connection.incr(key);
  }

  async sadd(key: redis.KeyType, value: string): Promise<number> {
    return this.connection.sadd(key, [value]);
  }

  async srem(key: redis.KeyType, value: string): Promise<number> {
    return this.connection.srem(key, [value]);
  }

  async smembers(key: redis.KeyType): Promise<string[]> {
    return this.connection.smembers(key);
  }

  async zadd(key: redis.KeyType, args: string[]): Promise<string|number> {
    return this.connection.zadd(key, ...args);
  }

  async zaddIncr(key: redis.KeyType, members: string[]): Promise<string|number> {
    const number = await this.zcard(key);
    return this.connection.zadd(key, String(number), ...members);
  }

  async zaddWithScore(key: redis.KeyType, score: string, value: string): Promise<string|number> {
    return this.connection.zadd(key, score, value);
  }

  async zrange(key: redis.KeyType, start: number, stop: number): Promise<any> {
    return this.connection.zrange(key, start, stop);
  }

  async zrevrange(key: redis.KeyType, start: number, stop: number): Promise<any> {
    return this.connection.zrevrange(key, start, stop);
  }

  async zrevrangePaginate(key: redis.KeyType, limit: number, offset: number): Promise<any> {
    const start = Number(offset);
    const stop = (Number(limit) - 1) + start;
    return this.connection.zrevrange(key, start, stop);
  }

  async zrangePaginate(key: redis.KeyType, limit: number, offset: number): Promise<any> {
    const start = Number(offset);
    const stop = (Number(limit) - 1) + start;
    return this.connection.zrange(key, start, stop);
  }

  async zcard(key: redis.KeyType): Promise<number> {
    return this.connection.zcard(key);
  }

  async close() {
    await this.connection.quit();
  }
}
