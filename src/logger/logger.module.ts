import { Module } from '@nestjs/common';
import { loggerProviders } from './logger.providers';
import { LoggerService } from './logger.service';
import { ConfigModule } from '../config/config.module';

export const LoggerModuleConfig = {
  imports: [ConfigModule],
  controllers: [],
  providers: [
    ...loggerProviders,
    LoggerService,
  ],
  exports: [
    ...loggerProviders,
    LoggerService,
  ],
};

@Module(LoggerModuleConfig)
export class LoggerModule { }
