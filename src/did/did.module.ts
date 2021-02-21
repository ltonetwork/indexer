import { Module } from '@nestjs/common';
import { didProviders } from './did.providers';
import { DidController } from './did.controller';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { StorageModule } from '../storage/storage.module';

export const DidModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule],
  controllers: [DidController],
  providers: [
    ...didProviders,
  ],
  exports: [
    ...didProviders,
  ],
};

@Module(DidModuleConfig)
export class DidModule { }
