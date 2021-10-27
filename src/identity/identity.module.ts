import { Module } from '@nestjs/common';

import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { IdentityListenerService } from './identity-listener.service';

import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { EmitterModule } from '../emitter/emitter.module';
import { StorageModule } from '../storage/storage.module';
import { VerificationMethodService } from './verification-method/verification-method.service';

export const IdentityModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule, EmitterModule],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    IdentityListenerService,
    VerificationMethodService,
  ],
};

@Module(IdentityModuleConfig)
export class IdentityModule {}
