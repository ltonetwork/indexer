import { Injectable } from '@nestjs/common';
import { ConfigLoaderService } from './config-loader.service';

@Injectable()
export class ConfigService {
  constructor(private readonly config: ConfigLoaderService) { }

  getEnv(): string {
    return this.config.get('env');
  }

  getLtoApiKey(): string {
    return this.config.get('lto.api.key');
  }

  getNodeUrl(): string {
    return this.config.get('anchor.node.url');
  }

  getNodeStartingBlock(): number | string {
    return this.config.get('anchor.node.starting_block');
  }

  getApiSecret(): string {
    const config = this.getLtoApiKey();

    if (config) {
      return config;
    }

    return this.config.get('anchor.api.secret');
  }

  getRedisClient(): string | string[] {
    return this.getRedisUrl() || this.getRedisCluster().split(';');
  }

  getRedisUrl(): string {
    return this.config.get('anchor.redis.url');
  }

  getRedisCluster(): string {
    return this.config.get('anchor.redis.cluster');
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
}
