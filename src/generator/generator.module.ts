import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { RequestModule } from '../request/request.module';
import { EmitterModule } from '../emitter/emitter.module';
import { NodeModule } from '../node/node.module';
import { GeneratorService } from './generator.service';
import { GeneratorListenerService } from './generator.listener.service';
import { GeneratorController } from './generator.controller';

export const GeneratorModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    EmitterModule,
    NodeModule,
    RequestModule,
  ],
  controllers: [GeneratorController],
  providers: [
    GeneratorService,
    GeneratorListenerService,
  ],
  exports: [
    GeneratorService,
  ],
};

@Module(GeneratorModuleConfig)
export class GeneratorModule { }
