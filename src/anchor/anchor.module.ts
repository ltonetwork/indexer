import { Module } from '@nestjs/common';
import { anchorProviders } from './anchor.providers';
import { AnchorService } from './anchor.service';
import { AnchorMonitorService } from './anchor-monitor.service';
import { AnchorIndexerService } from './anchor-indexer.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { TransactionModule } from '../transaction/transaction.module';

export const AnchorModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    EncoderModule,
    NodeModule,
    RedisModule,
    StorageModule,
    TransactionModule,
  ],
  controllers: [],
  providers: [
    ...anchorProviders,
    AnchorService,
    AnchorMonitorService,
    AnchorIndexerService,
  ],
  exports: [
    ...anchorProviders,
    AnchorService,
    AnchorMonitorService,
    AnchorIndexerService,
  ],
};

@Module(AnchorModuleConfig)
export class AnchorModule { }
