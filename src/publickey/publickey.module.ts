import { Module } from '@nestjs/common';

import { PublickeyListenerService } from './publickey-listener.service';

import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';
import { EmitterModule } from '../emitter/emitter.module';
import { StorageModule } from '../storage/storage.module';

export const PublickeyModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule, EmitterModule],
  providers: [PublickeyListenerService],
};

@Module(PublickeyModuleConfig)
export class PublickeyModule {}
