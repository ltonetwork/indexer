import { Module } from '@nestjs/common';
import { leveldbProviders } from './leveldb.providers';
import { LeveldbService } from './leveldb.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { EmitterModule } from '../../emitter/emitter.module';

export const LevelModuleConfig = {
  imports: [LoggerModule, ConfigModule, EmitterModule],
  controllers: [],
  providers: [...leveldbProviders, LeveldbService],
  exports: [...leveldbProviders, LeveldbService],
};

@Module(LevelModuleConfig)
export class LeveldbModule {}
