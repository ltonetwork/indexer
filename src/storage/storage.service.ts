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

  async getAnchor(hash: string): Promise<string> {
    await this.init();
    return await this.connection.get(`lto-anchor:anchor:${hash.toLowerCase()}`);
  }

  async saveAnchor(hash: string, transactionId: string): Promise<void> {
    await this.init();
    await this.connection.set(`lto-anchor:anchor:${hash.toLowerCase()}`, transactionId);
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
    await this.init();
    const height = await this.connection.get(`lto-anchor:processing-height`);
    return height ? Number(height) : null;
  }

  async saveProcessingHeight(height: string | number): Promise<void> {
    await this.init();
    await this.connection.set(`lto-anchor:processing-height`, String(height));
  }
}
