import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { RedisService } from '../../redis/redis.service';
import { StorageInterface } from '../interfaces/storage.interface';
import { Redis, Cluster } from 'ioredis';

@Injectable()
export class RedisStorageService implements StorageInterface, OnModuleInit, OnModuleDestroy {
  private connection: Redis | Cluster;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) { }

  async onModuleInit() { }

  async onModuleDestroy() {
    await this.close();
  }

  private async init() {
    if (!this.connection) {
      this.connection = await this.redis.connect(this.config.getRedisClient());
    }
  }

  private async close() {
    if (this.connection) {
      await this.connection.quit();
      delete this.connection;
    }
  }

  async getValue(key: string): Promise<string> {
    await this.init();
    return this.connection.get(key);
  }

  async getMultipleValues(keys: string[]): Promise<string[]> {
    await this.init();
    return this.connection.mget(keys);
  }

  async addValue(key: string, value: string): Promise<void> {
    await this.init();
    await this.connection.setnx(key, value);
  }

  async setValue(key: string, value: string): Promise<void> {
    await this.init();
    await this.connection.set(key, value);
  }

  async delValue(key: string): Promise<any> {
    await this.init();
    return this.connection.del(key);
  }

  async incrValue(key: string, amount = 1): Promise<void> {
    await this.init();
    await this.connection.incrby(key, amount);
  }

  async addObject(key: string, value: object): Promise<void> {
    await this.init();

    const promises = Object.entries(value).map(([f, v]) => this.connection.hsetnx(key, f, v));
    await Promise.all(promises);
  }

  async setObject(key: string, value: object): Promise<void> {
    await this.init();
    await this.connection.hset(key, ...Object.entries(value).flat());
  }

  async addToSet(key: string, value: string | Buffer): Promise<void> {
    await this.init();
    await this.connection.sadd(key, value);
  }

  async delFromSet(key: string, value: string | Buffer): Promise<void> {
    await this.init();
    await this.connection.srem(key, value);
  }

  async getSet(key: string): Promise<string[]> {
    await this.init();

    const res = await this.connection.smembers(key);
    return res ?? [];
  }

  async getBufferSet(key: string): Promise<Buffer[]> {
    await this.init();

    const res = await this.connection.smembersBuffer(key);
    return res ?? [];
  }

  async getObject(key: string): Promise<object> {
    await this.init();
    return this.connection.hgetall(key);
  }

  async countSortedSet(key: string): Promise<number> {
    await this.init();
    return this.connection.zcard(key);
  }

  async addToSortedSet(key: string, value: string, score: number): Promise<void> {
    await this.init();
    await this.connection.zadd(key, score, value);
  }

  async getSortedSet(key, limit?: number, offset?: number): Promise<string[]> {
    await this.init();

    const start = Number(offset ?? 0);
    const stop = limit !== undefined ? (Number(limit) - 1) + start : -1;

    return this.connection.zrevrange(key, start, stop);
  }
}
