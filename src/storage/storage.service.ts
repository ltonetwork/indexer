import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { RedisService } from '../redis/redis.service';
import { RedisConnection } from '../redis/classes/redis.connection';

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
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

  private async getValue(key: string): Promise<string> {
    await this.init();
    return this.connection.get(key);
  }


  private async setValue(key: string, value: string): Promise<string> {
    await this.init();
    return this.connection.set(key, value);
  }

  private async setObject(key: string, value: object): Promise<void> {
    await this.init();
    Object.keys(value).forEach(async (field) => {
      await this.connection.hset(key, field, value[field]);
    });
  }

  private async getObject(key: string): Promise<object> {
    await this.init();
    return this.connection.hgetall(key);
  }

  async getAnchor(hash: string): Promise<any> {
    return this.getObject(`lto-anchor:anchor:${hash.toLowerCase()}`);
  }

  async saveAnchor(hash: string, transaction: any) {
    return this.setObject(`lto-anchor:anchor:${hash.toLowerCase()}`, transaction);
  }

  async countTx(type: string, address: string): Promise<number> {
    await this.init();
    return await this.connection.zcard(`lto-anchor:tx:${type}:${address.toLowerCase()}`);
  }

  async indexTx(type: string, address: string, transactionId: string): Promise<void> {
    await this.init();
    await this.connection.zaddIncr(`lto-anchor:tx:${type}:${address.toLowerCase()}`, [transactionId]);
  }

  async getTx(type: string, address: string, limit: number, offset: number): Promise<string[]> {
    await this.init();
    return await this.connection.zrangePaginate(`lto-anchor:tx:${type}:${address.toLowerCase()}`, limit, offset);
  }

  async getProcessingHeight(): Promise<number | null> {
    const height = await this.getValue(`lto-anchor:processing-height`);
    return height ? Number(height) : null;
  }

  async saveProcessingHeight(height: string | number): Promise<void> {
    await this.setValue(`lto-anchor:processing-height`, String(height));
  }

  async clearProcessHeight(): Promise<void> {
    await this.init();
    return this.connection.del(`lto-anchor:processing-height`);
  }
}
