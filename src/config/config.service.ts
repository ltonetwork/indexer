import { Injectable } from '@nestjs/common';
import { ConfigLoaderService } from './config-loader.service';

@Injectable()
export class ConfigService {
  constructor(private readonly config: ConfigLoaderService) { }

  getEnv(): string {
    return this.config.get('env');
  }

  getNodeUrl(): string {
    return this.config.get('anchor.node.url');
  }

  getNodeStartingBlock(): number | string {
    return this.config.get('anchor.node.starting_block');
  }

  getApiSecret(): string {
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

  getLoggerConsole(): { level } {
    return this.config.get('anchor.logger.console');
  }

  getLoggerCombined(): { level } {
    return this.config.get('anchor.logger.combined');
  }
}
