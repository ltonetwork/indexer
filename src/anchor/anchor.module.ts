import { Module } from '@nestjs/common';
import { anchorProviders } from './anchor.providers';
import { AnchorService } from './anchor.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { TransactionModule } from '../transaction/transaction.module';
import { AnchorListenerService } from './anchor-listener.service';
import { EmitterModule } from '../emitter/emitter.module';

export const AnchorModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    EncoderModule,
    NodeModule,
    RedisModule,
    StorageModule,
    TransactionModule,
    EmitterModule,
  ],
  controllers: [],
  providers: [
    ...anchorProviders,
    AnchorService,
    AnchorListenerService,
  ],
  exports: [
    ...anchorProviders,
    AnchorService,
  ],
};

@Module(AnchorModuleConfig)
export class AnchorModule { }
