import { Module } from '@nestjs/common';
import { storageProviders } from './storage.providers';
import { StorageService } from './storage.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { RedisModule } from '../redis/redis.module';

export const StorageModuleConfig = {
  imports: [RedisModule, LoggerModule, ConfigModule],
  controllers: [],
  providers: [
    ...storageProviders,
    StorageService,
  ],
  exports: [
    ...storageProviders,
    StorageService,
  ],
};

@Module(StorageModuleConfig)
export class StorageModule { }
