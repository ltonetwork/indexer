import { Module } from '@nestjs/common';

import { DidController } from './did.controller';
import { DIDService } from './did.service';
import { DIDListenerService } from './did-listener.service';

import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';
import { EmitterModule } from '../emitter/emitter.module';
import { StorageModule } from '../storage/storage.module';
import { VerificationMethodService } from './verification-method/verification-method.service';

// Old path, redirects to new path
import { IdentitiesController } from './identities.controller';

export const IdentityModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule, EmitterModule],
  controllers: [DidController, IdentitiesController],
  providers: [DIDService, DIDListenerService, VerificationMethodService],
};

@Module(IdentityModuleConfig)
export class DidModule {}
