import { Module } from '@nestjs/common';
import { storageProviders } from './storage.providers';
import { StorageService } from './storage.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { RedisModule } from '../redis/redis.module';
import { LeveldbModule } from '../leveldb/leveldb.module';
import { tokens } from './types';
import { RedisGraphService } from './redis-graph/redis-graph.service';

export const StorageModuleConfig = {
  imports: [LeveldbModule, RedisModule, LoggerModule, ConfigModule],
  controllers: [],
  providers: [
    ...tokens,
    ...storageProviders,
    StorageService,
    RedisGraphService,
  ],
  exports: [
    ...tokens,
    ...storageProviders,
    StorageService,
    RedisGraphService,
  ],
};

@Module(StorageModuleConfig)
export class StorageModule { }
