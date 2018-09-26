import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { RedisConnection } from './classes/redis.connection';
import { REDIS } from '../constants';
import redis from 'ioredis';
import delay from 'delay';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public readonly connections: { [key: string]: RedisConnection } = {};

  constructor(
    private readonly logger: LoggerService,
    @Inject(REDIS) private readonly _redis: typeof redis,
  ) { }

  async onModuleInit() { }

  async onModuleDestroy() {
    await this.close();
  }

  async connect(config: string | string[]): Promise<RedisConnection> {
    const key = Array.isArray(config) ? config.join(';') : config;

    if (this.connections[key] && this.connections[key]) {
      return this.connections[key];
    }

    this.logger.debug(`redis: attempting to connect ${key}`);

    try {
      const connection = Array.isArray(config) ? new this._redis.Cluster(config) : new this._redis(config);
      this.connections[key] = new RedisConnection(connection);
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
        this.connections[key].close();
        delete this.connections[key];
      }
    }
  }
}
