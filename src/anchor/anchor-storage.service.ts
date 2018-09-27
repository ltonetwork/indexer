import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { RedisService } from '../redis/redis.service';
import { RedisConnection } from '../redis/classes/redis.connection';

@Injectable()
export class AnchorStorageService implements OnModuleInit, OnModuleDestroy {
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

  async saveAnchor(hash: string, transactionId: string): Promise<void> {
    await this.init();
    await this.connection.set(`lto-anchor:anchor:${hash}`, transactionId);
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
