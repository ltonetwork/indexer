import { Injectable } from '@nestjs/common';
import { ConfigLoaderService } from './config-loader.service';
import { StorageTypeEnum } from './enums/storage.type.enum';
import { RawRoles } from '../../trust-network/interfaces/trust-network.interface';

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

  isDIDIndexingEnabled(): boolean {
    return !!this.config.get('did.indexing') || !!this.config.get('identity.indexing');
  }

  getCredentialStatusIndexing(): 'none' | 'trust' | 'all' {
    return this.config.get('credential_status.indexing') as 'none' | 'trust' | 'all';
  }

  getCredentialDisputesIndexing(): 'none' | 'trust' | 'all' {
    return this.config.get('credential_status.disputes') as 'none' | 'trust' | 'all';
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

  getRoles(): RawRoles {
    return this.config.get('trust_network');
  }

  isTrustNetworkIndexingEnabled(): boolean {
    return Object.keys(this.config.get('trust_network')).length > 1;
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

  isAnchorBatched(): boolean {
    return !!this.config.get('anchor.batch');
  }
}
