import { Module } from '@nestjs/common';
import { ConfigLoaderService } from './config-loader.service';
import { ConfigService } from './config.service';

export const ConfigModuleConfig = {
  imports: [],
  controllers: [],
  providers: [ConfigLoaderService, ConfigService],
  exports: [ConfigLoaderService, ConfigService],
};

@Module(ConfigModuleConfig)
export class ConfigModule { }
