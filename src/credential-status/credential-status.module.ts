import { Module } from '@nestjs/common';

import { CredentialStatusController } from './credential-status.controller';
import { CredentialStatusService } from './credential-status.service';
import { CredentialStatusListenerService } from './credential-status-listener.service';

import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';
import { EmitterModule } from '../emitter/emitter.module';
import { StorageModule } from '../storage/storage.module';

export const IdentityModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule, EmitterModule],
  controllers: [CredentialStatusController],
  providers: [CredentialStatusService, CredentialStatusListenerService],
};

@Module(IdentityModuleConfig)
export class CredentialStatusModule {}
