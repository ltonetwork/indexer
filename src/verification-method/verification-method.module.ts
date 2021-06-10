import { Module } from '@nestjs/common';
import { verificationMethodProviders } from './verification-method.providers';
import { VerificationMethodService } from './verification-method.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RedisModule } from '../redis/redis.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { TransactionModule } from '../transaction/transaction.module';
import { VerificationMethodListenerService } from './verification-method-listener.service';
import { EmitterModule } from '../emitter/emitter.module';

export const VerificationMethodModuleConfig = {
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
    ...verificationMethodProviders,
    VerificationMethodService,
    VerificationMethodListenerService,
  ],
  exports: [
    ...verificationMethodProviders,
    VerificationMethodService,
  ],
};

@Module(VerificationMethodModuleConfig)
export class VerificationMethodModule { }
