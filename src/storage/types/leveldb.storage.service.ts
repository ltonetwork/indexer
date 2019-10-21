import { StorageInterface } from '../interfaces/storage.interface';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { LeveldbConnection } from '../../leveldb/classes/leveldb.connection';
import { LeveldbService } from '../../leveldb/leveldb.service';

@Injectable()
export class LeveldbStorageService implements StorageInterface, OnModuleInit, OnModuleDestroy {
  private connection: LeveldbConnection;

  constructor(
    private readonly config: ConfigService,
    private readonly leveldb: LeveldbService,
  ) { }

  async onModuleInit() { }

  async onModuleDestroy() {
    await this.close();
  }

  private async init() {
    if (this.connection) {
      return this.connection;
    }

    this.connection = await this.leveldb.connect(this.config.getLevelDb());
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
    await this.connection.del(key);
  }

  async setObject(key: string, value: object): Promise<void> {
    await this.init();
    this.setValue(key, JSON.stringify(value));
  }

  async getObject(key: string): Promise<object> {
    await this.init();
    return JSON.parse(await this.getValue(key));
  }

  countTx(type: string, address: string): Promise<number> {
    return this.connection.countTx(`lto-anchor:tx:${type}:${address}`);
  }

  async getTx(type: string, address: string, limit: number, offset: number): Promise<string[]> {
    await this.init();
    return this.connection.paginate(`lto-anchor:tx:${type}:${address}`, limit, offset);
  }

  async indexTx(type: string, address: string, transactionId: string, timestamp: number): Promise<void> {
    await this.init();
    // return this.connection.zaddIncr(`lto-anchor:tx:${type}:${address}`, transactionId);
    return this.connection.zaddWithScore(`lto-anchor:tx:${type}:${address}`, String(timestamp), transactionId);
  }
}
