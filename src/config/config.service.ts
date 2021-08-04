import { Injectable } from '@nestjs/common';
import { ConfigLoaderService } from './config-loader.service';
import { StorageTypeEnum } from './enums/storage.type.enum';
import toBoolean from 'boolean';
import { RoleConfig } from '../trust-network/interfaces/trust-network.interface';

@Injectable()
export class ConfigService {
  constructor(private readonly config: ConfigLoaderService) { }

  getEnv(): string {
    return this.config.get('env');
  }

  getPort(): string {
    return this.config.get('port');
  }

  getLtoApiKey(): string {
    return this.config.get('lto.api.key');
  }

  getLtoNodeUrl(): string {
    return this.config.get('lto.node.url');
  }

  getNodeUrl(): string {
    const config = this.getLtoNodeUrl();

    if (config) {
      return config;
    }

    return this.config.get('node.url');
  }

  getNodeStartingBlock(): number | string {
    return this.config.get('node.starting_block');
  }

  getNodeRestartSync(): boolean {
    return this.config.get('node.restart_sync');
  }

  getAuthToken(): string {
    return this.config.get('anchor.auth.token');
  }

  getApiSecret(): string {
    const config = this.getLtoApiKey();

    if (config) {
      return config;
    }

    return this.config.get('anchor.api.secret');
  }

  getAnchorFee(): number {
    return Number(this.config.get('anchor.fee'));
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

  getRedisGraph(): { host: string, port: string } {
    return {
      host: this.config.get('redis.graph.host'),
      port: this.config.get('redis.graph.port'),
    };
  }

  getLevelDb(): string {
    return this.config.get('leveldb');
  }

  getMonitorInterval(): number {
    return Number(this.config.get('anchor.monitor.interval'));
  }

  getLoggerGlobal(): { level } {
    return this.config.get('log');
  }

  getLoggerConsole(): { level } {
    const config = this.getLoggerGlobal();

    if (config.level) {
      return config;
    }

    return this.config.get('anchor.logger.console');
  }

  getLoggerCombined(): { level } {
    const config = this.getLoggerGlobal();

    if (config.level) {
      return config;
    }

    return this.config.get('anchor.logger.combined');
  }

  getStorageType(): StorageTypeEnum {
    return this.config.get('storage.type');
  }

  isProcessorEnabled(token: string): boolean {
    if (!this.config.has(`index.processor.${token}`)) {
      return true;
    }

    const flag = this.config.get(`index.processor.${token}`);
    return toBoolean(flag);
  }

  isStatsEnabled(token: 'operations' | 'transactions' | 'supply'): boolean {
    return !!this.config.get(`stats.${token}`);
  }

  getRoles(): RoleConfig {
    return this.config.get('roles');
  }

  getAssociationIndexing(): 'none' | 'trust' | 'all' {
    return this.config.get('association.indexing');
  }

  getAnchorIndexing(): 'none' | 'trust' | 'all' {
    return this.config.get('anchor.indexing');
  }

  isAssociationGraphEnabled(): boolean {
    return !!this.config.get('association.use_graph');
  }
}
