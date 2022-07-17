import { Module } from '@nestjs/common';
import { HashController } from './hash.controller';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../encoder/encoder.module';
import { AuthModule } from '../auth/auth.module';
import { HashService } from './hash.service';
import { HashListenerService } from './hash-listener.service';

export const HashModuleConfig = {
  imports: [LoggerModule, ConfigModule, NodeModule, StorageModule, EncoderModule, AuthModule],
  controllers: [HashController],
  providers: [HashService, HashListenerService],
};

@Module(HashModuleConfig)
export class HashModule { }
