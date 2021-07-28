import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { RequestModule } from '../request/request.module';
import { TransactionModule } from '../transaction/transaction.module';
import { StatsListenerService } from './stats.listener.service';
import { EmitterModule } from '../emitter/emitter.module';
import { AnchorModule } from '../anchor/anchor.module';
import { SupplyService } from './supply/supply.service';
import { OperationsService } from './operations/operations.service';
import { StatsController } from './stats.controller';
import { NodeModule } from '../node/node.module';

export const StatsModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    EncoderModule,
    RedisModule,
    StorageModule,
    TransactionModule,
    EmitterModule,
    AnchorModule,
    NodeModule,
    RequestModule,
  ],
  controllers: [StatsController],
  providers: [
    StatsService,
    SupplyService,
    OperationsService,
    StatsListenerService,
  ],
  exports: [
    StatsService,
    SupplyService,
    OperationsService,
  ],
};

@Module(StatsModuleConfig)
export class StatsModule { }
