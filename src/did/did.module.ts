import { Module } from '@nestjs/common';

import { DidController } from './did.controller';
import { DidService } from './did.service';
import { DidListenerService } from './did-listener.service';

import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { EmitterModule } from '../emitter/emitter.module';
import { StorageModule } from '../storage/storage.module';
import { VerificationMethodService } from './verification-method/verification-method.service';

// Old path, redirects to new path
import { IdentitiesController } from './identities.controller';

export const IdentityModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule, EmitterModule],
  controllers: [DidController, IdentitiesController],
  providers: [DidService, DidListenerService, VerificationMethodService],
};

@Module(IdentityModuleConfig)
export class DidModule {}
