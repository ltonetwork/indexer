import { StorageInterface } from '../interfaces/storage.interface';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../../common/config/config.service';
import { LeveldbConnection } from '../../common/leveldb/classes/leveldb.connection';
import { LeveldbService } from '../../common/leveldb/leveldb.service';

@Injectable()
export class LeveldbStorageService implements StorageInterface, OnModuleDestroy {
  private connection: LeveldbConnection;

  constructor(private readonly config: ConfigService, private readonly leveldb: LeveldbService) {}

  async onModuleDestroy() {
    await this.close();
  }

  private async init() {
    if (!this.connection) {
      this.connection = await this.leveldb.connect(this.config.getLevelDbName());
    }
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

  async getMultipleValues(keys: string[]): Promise<string[]> {
    await this.init();
    return this.connection.mget(keys);
  }

  async addValue(key: string, value: string): Promise<void> {
    await this.init();
    await this.connection.add(key, value);
  }

  async setValue(key: string, value: string): Promise<void> {
    await this.init();
    await this.connection.set(key, value);
  }

  async delValue(key: string): Promise<void> {
    await this.init();
    await this.connection.del(key);
  }

  async incrValue(key: string, amount = 1): Promise<void> {
    await this.init();
    await this.connection.incr(key, amount);
  }

  async addObject(key: string, value: Record<string | number, any>): Promise<void> {
    await this.init();
    await this.connection.add(key, JSON.stringify(value));
  }

  async setObject(key: string, value: Record<string | number, any>): Promise<void> {
    return this.setValue(key, JSON.stringify(value));
  }

  async getObject(key: string): Promise<Record<string | number, any>> {
    const res = await this.getValue(key);
    return res ? JSON.parse(res) : {};
  }

  async addToSet(key: string, value: string | Buffer): Promise<void> {
    await this.connection.sadd(key, value instanceof Buffer ? value.toString('base64') : value);
  }

  async delFromSet(key: string, value: string | Buffer): Promise<void> {
    await this.connection.srem(key, value instanceof Buffer ? value.toString('base64') : value);
  }

  async getSet(key: string): Promise<string[]> {
    return this.connection.sget(key);
  }

  async getBufferSet(key: string): Promise<Buffer[]> {
    const values = await this.connection.sget(key);
    return values.map((value) => Buffer.from(value, 'base64'));
  }

  async countSortedSet(key: string): Promise<number> {
    await this.init();
    return this.connection.zcount(key);
  }

  async getSortedSet(key: string, limit?: number, offset?: number): Promise<string[]> {
    await this.init();
    return this.connection.paginate(key, limit, offset);
  }

  async addToSortedSet(key: string, value: string, score: number): Promise<void> {
    await this.init();
    await this.connection.zaddWithScore(key, String(score), value);
  }
}
