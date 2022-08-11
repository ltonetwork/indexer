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

    const promises = Object.keys(value).map(field => this.connection.hsetnx(key, field, value[field]));
    await Promise.all(promises);
  }

  async setObject(key: string, value: object): Promise<void> {
    await this.init();

    const promises = Object.keys(value).map(field => this.connection.hset(key, field, value[field]));
    await Promise.all(promises);
  }

  async sadd(key: string, value: string): Promise<void> {
    await this.init();
    await this.connection.sadd(key, value);
  }

  async srem(key: string, value: string): Promise<void> {
    await this.init();
    await this.connection.srem(key, value);
  }

  async getArray(key: string): Promise<string[]> {
    await this.init();

    const res = await this.connection.smembers(key);
    return res ?? [];
  }

  async getObject(key: string): Promise<object> {
    await this.init();
    return this.connection.hgetall(key);
  }

  async countTx(type: string, address: string): Promise<number> {
    await this.init();
    return this.connection.zcard(`lto:tx:${type}:${address}`);
  }

  async indexTx(type: string, address: string, transactionId: string, timestamp: number): Promise<void> {
    await this.init();
    await this.connection.zadd(`lto:tx:${type}:${address}`, String(timestamp), transactionId);
  }

  async getTx(type: string, address: string, limit: number, offset: number): Promise<string[]> {
    await this.init();

    const start = Number(offset);
    const stop = (Number(limit) - 1) + start;

    return this.connection.zrevrange(`lto:tx:${type}:${address}`, start, stop);
  }

  async flush() {
    // Nothing to do
  }
}
