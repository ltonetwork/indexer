import { Module } from '@nestjs/common';
import { hashProviders } from './hash.providers';
import { HashController } from './hash.controller';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';

export const HashModuleConfig = {
  imports: [LoggerModule, ConfigModule, NodeModule, StorageModule, EncoderModule],
  controllers: [HashController],
  providers: [
    ...hashProviders,
  ],
  exports: [
    ...hashProviders,
  ],
};

@Module(HashModuleConfig)
export class HashModule { }
