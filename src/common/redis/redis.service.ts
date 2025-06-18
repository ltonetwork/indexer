import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { REDIS } from '../../constants';
import redis, { Redis, Cluster } from 'ioredis';
import delay from 'delay';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly connections: { [key: string]: Redis | Cluster } = {};

  constructor(private readonly logger: LoggerService, @Inject(REDIS) private readonly _redis: typeof redis) {}

  async onModuleDestroy() {
    await this.close();
  }

  async connect(config: string | string[]): Promise<Redis | Cluster> {
    const key = Array.isArray(config) ? config.join(';') : config;

    if (this.connections[key] && this.connections[key]) {
      return this.connections[key];
    }

    this.logger.debug(`redis: attempting to connect ${key}`);

    try {
      this.connections[key] = Array.isArray(config) ? new this._redis.Cluster(config) : new this._redis(config);
      this.logger.info(`redis: successfully connected ${key}`);
      return this.connections[key];
    } catch (e) {
      this.logger.error(`redis: failed to connect ${key} '${e}'`);
      await delay(2000);
      return this.connect(config);
    }
  }

  async close() {
    for (const key in this.connections) {
      if (this.connections.hasOwnProperty(key)) {
        this.logger.info(`redis: closing connection ${key}`);
        this.connections[key].quit();
        delete this.connections[key];
      }
    }
  }
}
