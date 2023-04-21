import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { LeveldbConnection } from './classes/leveldb.connection';
import { LEVEL } from '../constants';
import level from 'level';
import delay from 'delay';
import {setInterval} from 'timers';

@Injectable()
export class LeveldbService implements OnModuleInit, OnModuleDestroy {
  public connection: LeveldbConnection;

  constructor(
    private readonly logger: LoggerService,
    @Inject(LEVEL) private readonly _level: typeof level,
  ) { }

  async onModuleInit() {
    setInterval(() => {
      if (this.connection) {
        this.connection.flush();
      }
    }, 10000);
  }

  async onModuleDestroy() {
    await this.close();
  }

  async connect(config: string): Promise<LeveldbConnection> {
    try {
      this.logger.debug(`level: configuration file to connect ${config}`);
      const connection = this._level(config);
      this.connection = new LeveldbConnection(connection);
      return this.connection;
    } catch (e) {
      this.logger.error(`level: failed to connect '${e}'`);
      await delay(2000);
      return this.connect(config);
    }
  }

  async close() {
    if (this.connection) {
      this.logger.debug(`level: close`);
      await this.connection.close();
    }
  }
}
