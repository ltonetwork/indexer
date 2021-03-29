import { Module } from '@nestjs/common';
import { identityProviders } from './identity.providers';
import { IdentityController } from './identity.controller';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { StorageModule } from '../storage/storage.module';

export const DidModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule],
  controllers: [IdentityController],
  providers: [
    ...identityProviders,
  ],
  exports: [
    ...identityProviders,
  ],
};

@Module(DidModuleConfig)
export class IdentityModule { }
