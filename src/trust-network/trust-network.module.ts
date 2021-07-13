import { Module } from '@nestjs/common';
import { TrustNetworkService } from './trust-network.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { TransactionModule } from '../transaction/transaction.module';
import { TrustNetworkListenerService } from './trust-network.listener.service';
import { TrustNetworkController } from './trust-network.controller';
import { EmitterModule } from '../emitter/emitter.module';

export const TrustNetworkModuleConfig = {
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
  controllers: [TrustNetworkController],
  providers: [
    TrustNetworkService,
    TrustNetworkListenerService,
  ],
  exports: [
    TrustNetworkService,
  ],
};

@Module(TrustNetworkModuleConfig)
export class TrustNetworkModule { }
