import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { StorageInterface } from './interfaces/storage.interface';
import { StorageTypeEnum } from '../config/enums/storage.type.enum';
import storageServices from './types';
import PascalCase from 'pascal-case';
import { LoggerService } from '../logger/logger.service';
import { VerificationMethod } from '../identity/verification-method/model/verification-method.model';
import { Role, RawRole } from '../trust-network/interfaces/trust-network.interface';
import { RedisGraphService } from './redis-graph/redis-graph.service';

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private storage: StorageInterface;
  private graphEnabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
    private readonly redisGraph: RedisGraphService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    if (this.config.getStorageType() === StorageTypeEnum.Redis) {
      const name = PascalCase(`${StorageTypeEnum.Redis}_storage_service`);
      this.storage = this.moduleRef.get(storageServices[name]);
    } else {
      const name = PascalCase(`${StorageTypeEnum.LevelDB}_storage_service`);
      this.storage = this.moduleRef.get(storageServices[name]);
    }

    this.graphEnabled = this.config.isAssociationGraphEnabled();
  }

  async onModuleDestroy() {}

  getAnchor(hash: string): Promise<any> {
    return this.storage.getObject(`lto:anchor:${hash.toLowerCase()}`);
  }

  saveAnchor(hash: string, info: object) {
    return this.storage.addObject(`lto:anchor:${hash.toLowerCase()}`, info);
  }

  getMappedAnchor(key: string): Promise<any> {
    return this.storage.getObject(`lto:mapped-anchor:${key.toLowerCase()}`);
  }

  saveMappedAnchor(key: string, info: object) {
    return this.storage.addObject(`lto:mapped-anchor:${key.toLowerCase()}`, info);
  }

  getPublicKey(address: string): Promise<{publicKey?: string, keyType?: string}> {
    return this.storage.getObject(`lto:pubkey:${address}`)
        .catch(() => {
          const publicKey = this.storage.getValue(`lto:pubkey:${address}`);
          return publicKey ? {publicKey, keyType: 'ed25519'} : {};
        })
        .then(r => r ? r as {publicKey: string, keyType: string} : {});
  }

  savePublicKey(address: string, publicKey: string, keyType: string) {
    return this.storage.addObject(`lto:pubkey:${address}`, {publicKey, keyType});
  }

  async getVerificationMethods(address: string): Promise<VerificationMethod[]> {
    const methods = await this.storage.getObject(`lto:verification:${address}`);

    return Object.values(methods)
      .filter(data => !data.revokedAt)
      .map(data => new VerificationMethod(data.relationships, data.sender, data.recipient, data.createdAt));
  }

  async saveVerificationMethod(address: string, verificationMethod: VerificationMethod): Promise<void> {
    const data = await this.storage.getObject(`lto:verification:${address}`);

    const newData = verificationMethod.json();

    data[newData.recipient] = newData;

    return this.storage.setObject(`lto:verification:${address}`, data);
  }

  async getRolesFor(address: string): Promise<RawRole | {}> {
    return this.storage.getObject(`lto:roles:${address}`);
  }

  async saveRoleAssociation(recipient: string, sender: string, data: Role): Promise<void> {
    const roles = await this.storage.getObject(`lto:roles:${recipient}`);

    roles[data.role] = { sender, type: data.type };

    return this.storage.setObject(`lto:roles:${recipient}`, roles);
  }

  async removeRoleAssociation(recipient: string, data: Role): Promise<void> {
    const roles = await this.storage.getObject(`lto:roles:${recipient}`);

    delete roles[data.role];

    return this.storage.setObject(`lto:roles:${recipient}`, roles);
  }

  async saveAssociation(sender: string, recipient: string): Promise<void> {
    if (this.graphEnabled) {
      return await this.redisGraph.saveAssociation(sender, recipient);
    }

    await this.storage.sadd(`lto:assoc:${sender}:childs`, recipient);
    await this.storage.sadd(`lto:assoc:${recipient}:parents`, sender);

    this.logger.debug(`storage-service: Add assoc for ${sender} child ${recipient}`);
  }

  async removeAssociation(sender: string, recipient: string): Promise<void> {
    if (this.graphEnabled) {
      return await this.redisGraph.removeAssociation(sender, recipient);
    }

    await this.storage.srem(`lto:assoc:${sender}:childs`, recipient);
    await this.storage.srem(`lto:assoc:${recipient}:parents`, sender);

    await this.recurRemoveAssociation(recipient);
    this.logger.debug(`storage-service: removed assoc for ${sender} child ${recipient}`);
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
    if (this.graphEnabled) {
      return await this.redisGraph.getAssociations(address);
    }

    const children = await this.storage.getArray(`lto:assoc:${address}:childs`);
    const parents = await this.storage.getArray(`lto:assoc:${address}:parents`);

    return { children, parents };
  }

  async incrTxStats(type: string, day: number, amount = 1): Promise<void> {
    if (amount > 0) {
      return this.storage.incrValue(`lto:stats:transactions:${type}:${day}`, amount);
    }
  }

  async incrOperationStats(day: number, amount = 1): Promise<void> {
    if (amount > 0) {
      return this.storage.incrValue(`lto:stats:operations:${day}`, amount);
    }
  }

  async getOperationStats(from: number, to: number): Promise<{ period: string; count: number }[]> {
    const length = to - from + 1;
    const keys = Array.from({ length }, (v, i) => `lto:stats:operations:${from + i}`);
    const values = await this.storage.getMultipleValues(keys);

    const periods = Array.from({ length }, (v, i) => new Date((from + i) * 86400000));
    return periods.map((period: Date, index: number) => ({
      period: this.formatPeriod(period),
      count: Number(values[index]),
    }));
  }

  async getTxStats(type: string, from: number, to: number): Promise<{ period: string; count: number }[]> {
    const length = to - from + 1;
    const keys = Array.from({ length }, (v, i) => `lto:stats:transactions:${type}:${from + i}`);
    const values = await this.storage.getMultipleValues(keys);

    const periods = Array.from({ length }, (v, i) => new Date((from + i) * 86400000));
    return periods.map((period: Date, index: number) => ({
      period: this.formatPeriod(period),
      count: Number(values[index]),
    }));
  }

  async incrTxFeeBurned(amount: number): Promise<void> {
    return this.storage.incrValue('lto:stats:supply:txfeeburned', amount);
  }

  async getTxFeeBurned(): Promise<number> {
    const value = await this.storage.getValue('lto:stats:supply:txfeeburned').catch(() => '0');
    return Number(value || '0');
  }

  async incrLeaseStats(day: number, amountIn: number, amountOut: number): Promise<void> {
    return Promise.all([
      this.storage.incrValue(`lto:stats:lease:in:${day}`, amountIn),
      this.storage.incrValue(`lto:stats:lease:out:${day}`, amountOut),
    ]).then(() => {});
  }

  async getLeaseStats(from, to): Promise<{ period: string; in: number, out: number }[]> {
    const length = to - from + 1;

    const keysIn = Array.from({ length }, (v, i) => `lto:stats:lease:in:${from + i}`);
    const valuesIn = (await this.storage.getMultipleValues(keysIn)).map(amount => Number(amount || '0'));

    const keysOut = Array.from({ length }, (v, i) => `lto:stats:lease:out:${from + i}`);
    const valuesOut = (await this.storage.getMultipleValues(keysOut)).map(amount => Number(amount || '0'));

    const periods = Array.from({ length }, (v, i) => new Date((from + i) * 86400000));

    return periods.map((period: Date, index: number) => ({
      period: this.formatPeriod(period),
      in: valuesIn[index],
      out: valuesOut[index],
    }));
  }

  private formatPeriod(date: Date): string {
    const year = String(date.getUTCFullYear());
    const month = ('0' + (date.getUTCMonth() + 1)).substr(-2);
    const day = ('0' + date.getUTCDate()).substr(-2);

    return `${year}-${month}-${day} 00:00:00`;
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

  saveProcessingHeight(height: string | number): Promise<void> {
    return this.storage.setValue(`lto:processing-height`, String(height));
  }

  clearProcessHeight(): Promise<void> {
    return this.storage.delValue(`lto:processing-height`);
  }
}
