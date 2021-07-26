import { Module } from '@nestjs/common';
import { OperationStatsService } from './operation-stats.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { TransactionModule } from '../transaction/transaction.module';
import { OperationStatsListenerService } from './operation-stats.listener.service';
import { OperationStatsController } from './operation-stats.controller';
import { EmitterModule } from '../emitter/emitter.module';
import { AnchorModule } from '../anchor/anchor.module';

export const OperationStatsModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    EncoderModule,
    RedisModule,
    StorageModule,
    TransactionModule,
    EmitterModule,
    AnchorModule,
  ],
  controllers: [OperationStatsController],
  providers: [
    OperationStatsService,
    OperationStatsListenerService,
  ],
  exports: [
    OperationStatsService,
  ],
};

@Module(OperationStatsModuleConfig)
export class OperationStatsModule { }
