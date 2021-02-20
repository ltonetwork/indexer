import { Module } from '@nestjs/common';
import { publicKeyProviders } from './public-key.providers';
import { PublicKeyService } from './public-key.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { TransactionModule } from '../transaction/transaction.module';
import { PublicKeyListenerService } from './public-key-listener.service';
import { EmitterModule } from '../emitter/emitter.module';

export const PublicKeyModuleConfig = {
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
    ...publicKeyProviders,
    PublicKeyService,
    PublicKeyListenerService,
  ],
  exports: [
    ...publicKeyProviders,
    PublicKeyService,
  ],
};

@Module(PublicKeyModuleConfig)
export class PublicKeyModule { }
