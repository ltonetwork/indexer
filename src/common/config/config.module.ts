import { Module } from '@nestjs/common';
import { ConfigLoaderService } from './config-loader.service';
import { ConfigService } from './config.service';

const ConfigLoaderFactory = {
  provide: ConfigLoaderService,
  useFactory: async () => {
    const service = new ConfigLoaderService();
    await service.onModuleInit();
    return service;
  },
};

export const ConfigModuleConfig = {
  providers: [ConfigLoaderFactory, ConfigService],
  exports: [ConfigLoaderFactory, ConfigService],
};

@Module(ConfigModuleConfig)
export class ConfigModule { }
