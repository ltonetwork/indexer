import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';
import { RedisModule } from '../common/redis/redis.module';
import { LeveldbModule } from '../common/leveldb/leveldb.module';
import { RedisGraphService } from './redis/redis-graph.service';
import { tokens } from './index';

export const StorageModuleConfig = {
  imports: [LeveldbModule, RedisModule, LoggerModule, ConfigModule],
  controllers: [],
  providers: [
    ...tokens,
    StorageService,
    RedisGraphService,
  ],
  exports: [
    ...tokens,
    StorageService,
    RedisGraphService,
  ],
};

@Module(StorageModuleConfig)
export class StorageModule { }
