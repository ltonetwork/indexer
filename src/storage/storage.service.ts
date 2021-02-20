import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { StorageInterface } from './interfaces/storage.interface';
import { StorageTypeEnum } from '../config/enums/storage.type.enum';
import storageServices from './types';
import PascalCase from 'pascal-case';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { Association } from '../associations/dto/association.dto';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private storage: StorageInterface;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
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
    return this.storage.getObject(`lto:anchor:${hash.toLowerCase()}`);
  }

  saveAnchor(hash: string, transaction: object) {
    return this.storage.setObject(`lto:anchor:${hash.toLowerCase()}`, transaction);
  }

  savePublicKey(address: string, publicKey: string) {
    return this.storage.setValue(`lto:pubkey:${address}`, publicKey);
  }

  async saveAssociation(transaction: Transaction) {
    await this.storage.sadd(`lto:assoc:${transaction.sender}:childs`, transaction.party);
    await this.storage.sadd(`lto:assoc:${transaction.party}:parents`, transaction.sender);

    this.logger.debug(`storage-service: Add assoc for ${transaction.sender} child ${transaction.party}`);
  }

  async removeAssociation(transaction: Transaction) {
    await this.storage.srem(`lto:assoc:${transaction.sender}:childs`, transaction.party);
    await this.storage.srem(`lto:assoc:${transaction.party}:parents`, transaction.sender);

    await this.recurRemoveAssociation(transaction.party);
    this.logger.debug(`storage-service: removed assoc for ${transaction.sender} child ${transaction.party}`);
  }

  async recurRemoveAssociation(address: string) {
    const childAssocs = await this.storage.getArray(`lto:assoc:${address}:childs`);
    for (const child of childAssocs) {
      await this.storage.srem(`lto:assoc:${address}:childs`, child);
      await this.storage.srem(`lto:assoc:${child}:parents`, address);
      await this.recurRemoveAssociation(child);
      this.logger.debug(`storage-service: Remove assoc for ${address} child ${child}`);
    }
  }

  async getAssociations(address: string): Promise<any> {
    const associations = {
      children: await this.storage.getArray(`lto:assoc:${address}:childs`),
      parents: await this.storage.getArray(`lto:assoc:${address}:parents`),
    };

    return associations;
  }

  setArray(key: string, value: object[]): Promise<string> {
    return this.storage.setValue(key, JSON.stringify(value));
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
      height = await this.storage.getValue(`lto:processing-height`);
    } catch (e) {}
    return height ? Number(height) : null;
  }

  saveProcessingHeight(height: string | number): Promise<string> {
    return this.storage.setValue(`lto:processing-height`, String(height));
  }

  clearProcessHeight(): Promise<void> {
    return this.storage.delValue(`lto:processing-height`);
  }
}
