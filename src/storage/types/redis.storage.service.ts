import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { RedisService } from '../../redis/redis.service';
import { RedisConnection } from '../../redis/classes/redis.connection';
import { StorageInterface } from '../interfaces/storage.interface';

@Injectable()
export class RedisStorageService implements StorageInterface, OnModuleInit, OnModuleDestroy {
  private connection: RedisConnection;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) { }

  async onModuleInit() { }

  async onModuleDestroy() {
    await this.close();
  }

  private async init() {
    if (this.connection) {
      return this.connection;
    }

    this.connection = await this.redis.connect(this.config.getRedisClient());
  }

  private async close() {
    if (this.connection) {
      await this.connection.close();
      delete this.connection;
    }
  }

  async getValue(key: string): Promise<string> {
    await this.init();
    return this.connection.get(key);
  }

  async setValue(key: string, value: string): Promise<string> {
    await this.init();
    return this.connection.set(key, value);
  }

  async delValue(key: string): Promise<void> {
    await this.init();
    return this.connection.del(key);
  }

  async setObject(key: string, value: object): Promise<void> {
    await this.init();
    Object.keys(value).forEach(async (field) => {
      await this.connection.hset(key, field, value[field]);
    });
  }

  async getObject(key: string): Promise<object> {
    await this.init();
    return this.connection.hgetall(key);
  }

  async countTx(type: string, address: string): Promise<number> {
    await this.init();
    return await this.connection.zcard(`lto-anchor:tx:${type}:${address}`);
  }

  async indexTx(type: string, address: string, transactionId: string, timestamp: number): Promise<void> {
    await this.init();
    await this.connection.zaddWithScore(`lto-anchor:tx:${type}:${address}`, String(timestamp), transactionId);
  }

  async getTx(type: string, address: string, limit: number, offset: number): Promise<string[]> {
    await this.init();
    return await this.connection.zrevrangePaginate(`lto-anchor:tx:${type}:${address}`, limit, offset);
  }
}
