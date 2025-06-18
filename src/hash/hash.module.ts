import { Module } from '@nestjs/common';
import { HashController } from './hash.controller';
import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../common/encoder/encoder.module';
import { AuthModule } from '../common/auth/auth.module';
import { HashService } from './hash.service';
import { HashListenerService } from './hash-listener.service';
import { EmitterModule } from '../emitter/emitter.module';

export const HashModuleConfig = {
  imports: [LoggerModule, ConfigModule, NodeModule, StorageModule, EncoderModule, AuthModule, EmitterModule],
  controllers: [HashController],
  providers: [HashService, HashListenerService],
};

@Module(HashModuleConfig)
export class HashModule {}
