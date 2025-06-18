import { Module } from '@nestjs/common';
import { emitterProviders } from './emitter.providers';
import { EmitterService } from './emitter.service';
import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';

export const EmitterModuleConfig = {
  imports: [LoggerModule, ConfigModule],
  controllers: [],
  providers: [...emitterProviders, EmitterService],
  exports: [...emitterProviders, EmitterService],
};

@Module(EmitterModuleConfig)
export class EmitterModule {}
