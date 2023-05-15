import { Injectable } from '@nestjs/common';
import { ConfigLoaderService } from './config-loader.service';
import { StorageTypeEnum } from './enums/storage.type.enum';
import { RawRole } from '../trust-network/interfaces/trust-network.interface';

@Injectable()
export class ConfigService {
  constructor(private readonly config: ConfigLoaderService) {}

  getEnv(): string {
    return this.config.get('env');
  }

  getApiPrefix(): string {
    return this.config.get('api_prefix');
  }

  getApiDocsUrl(): string {
    const prefix = this.config.get('api_prefix');
    return (prefix ? '/' + prefix : '') + '/api-docs';
  }

  getPort(): number {
    return this.config.get('port');
  }

  getNodeUrl(): string {
    return this.config.get('node.url');
  }

  getNodeApiKey(): string {
    return this.config.get('node.api_key');
  }

  getStartingBlock(): number {
    return this.config.get('starting_block');
  }

  getRestartSync(): boolean {
    return this.config.get('restart_sync');
  }

  getAuthToken(): string {
    return this.config.get('auth.token');
  }

  getRedisClient(): string | string[] {
    return this.getRedisUrl() || this.getRedisCluster().split(';');
  }

  getRedisUrl(): string {
    return this.config.get('redis.url');
  }

  getRedisCluster(): string {
    return this.config.get('redis.cluster');
  }

  getLevelDbName(): string {
    return this.config.get('leveldb.name');
  }

  getMonitorInterval(): number {
    return Number(this.config.get('monitor.interval'));
  }

  getLoggerLevel(): string {
    return this.config.get('log.level');
  }

  getStorageType(): StorageTypeEnum {
    return this.config.get('storage.type') as StorageTypeEnum;
  }

  isIdentityIndexingEnabled(): boolean {
    return !!this.config.get('identity.indexing');
  }

  isTransactionIndexingEnabled(): boolean {
    return !!this.config.get('transaction.indexing');
  }

  isStatsEnabled(token?: 'operations' | 'transactions' | 'supply' | 'lease'): boolean {
    if (!token) {
      return Object.values(this.config.get('stats')).includes(true);
    }

    return !!this.config.get(`stats.${token}`);
  }

  getRoles(): RawRole {
    return this.config.get('trust_network.roles');
  }

  isTrustNetworkIndexingEnabled(): boolean {
    return !!this.config.get('trust_network.indexing');
  }

  getAssociationIndexing(): 'none' | 'trust' | 'all' {
    return this.config.get('association.indexing') as 'none' | 'trust' | 'all';
  }

  getAnchorIndexing(): 'none' | 'trust' | 'all' {
    return this.config.get('anchor.indexing') as 'none' | 'trust' | 'all';
  }

  isAssociationGraphEnabled(): boolean {
    return !!this.config.get('association.use_graph');
  }

  // @todo: add support for more chains (only eip155 for now)
  isEip155IndexingEnabled(): boolean {
    return !!this.config.get('cross_chain.eip155.indexing');
  }

  isAnchorBatched(): boolean {
    return !!this.config.get('anchor.batch');
  }
}
