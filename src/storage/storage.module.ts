import { Module } from '@nestjs/common';
import { storageProviders } from './storage.providers';
import { StorageService } from './storage.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { RedisModule } from '../redis/redis.module';
import { tokens } from './types';

export const StorageModuleConfig = {
  imports: [RedisModule, LoggerModule, ConfigModule],
  controllers: [],
  providers: [
    ...tokens,
    ...storageProviders,
    StorageService,
  ],
  exports: [
    ...tokens,
    ...storageProviders,
    StorageService,
  ],
};

@Module(StorageModuleConfig)
export class StorageModule { }
