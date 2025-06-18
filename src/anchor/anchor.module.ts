import { Module } from '@nestjs/common';
import { anchorProviders } from './anchor.providers';
import { AnchorService } from './anchor.service';
import { ConfigModule } from '../common/config/config.module';
import { LoggerModule } from '../common/logger/logger.module';
import { RedisModule } from '../common/redis/redis.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../common/encoder/encoder.module';
import { TransactionModule } from '../transaction/transaction.module';
import { AnchorListenerService } from './anchor-listener.service';
import { EmitterModule } from '../emitter/emitter.module';
import { TrustNetworkModule } from '../trust-network/trust-network.module';
import { MappedAnchorService } from './mapped-anchor.service';

export const AnchorModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    EncoderModule,
    NodeModule,
    RedisModule,
    StorageModule,
    TransactionModule,
    TrustNetworkModule,
    EmitterModule,
  ],
  controllers: [],
  providers: [...anchorProviders, AnchorService, MappedAnchorService, AnchorListenerService],
  exports: [...anchorProviders, AnchorService, MappedAnchorService],
};

@Module(AnchorModuleConfig)
export class AnchorModule {}
