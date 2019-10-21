import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { StorageInterface } from './interfaces/storage.interface';
import { StorageTypeEnum } from '../config/enums/storage.type.enum';
import storageServices from './types';
import PascalCase from 'pascal-case';

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private storage: StorageInterface;

  constructor(
    private readonly config: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) { }

  async onModuleInit() {
    if (this.config.getStorageType() === StorageTypeEnum.Redis) {
      const name = PascalCase(`${StorageTypeEnum.Redis}_storage_service`);
      this.storage = this.moduleRef.get(storageServices[name]);
    } else {
      const name = PascalCase(`${StorageTypeEnum.LevelDB}_storage_service`);
      this.storage = this.moduleRef.get(storageServices[name]);
    }
  }

  async onModuleDestroy() {}

  getAnchor(hash: string): Promise<any> {
    return this.storage.getObject(`lto-anchor:anchor:${hash.toLowerCase()}`);
  }

  saveAnchor(hash: string, transaction: any) {
    return this.storage.setObject(`lto-anchor:anchor:${hash.toLowerCase()}`, transaction);
  }

  countTx(type: string, address: string): Promise<number> {
    return this.storage.countTx(type, address);
  }

  indexTx(type: string, address: string, transactionId: string, timestamp: number): Promise<void> {
    return this.storage.indexTx(type, address, transactionId, timestamp);
  }

  getTx(type: string, address: string, limit: number, offset: number): Promise<string[]> {
    return this.storage.getTx(type, address, limit, offset);
  }

  async getProcessingHeight(): Promise<number | null> {
    let height;
    try {
      height = await this.storage.getValue(`lto-anchor:processing-height`);
    } catch (e) {}
    return height ? Number(height) : null;
  }

  saveProcessingHeight(height: string | number): Promise<string> {
    return this.storage.setValue(`lto-anchor:processing-height`, String(height));
  }

  clearProcessHeight(): Promise<void> {
    return this.storage.delValue(`lto-anchor:processing-height`);
  }
}
