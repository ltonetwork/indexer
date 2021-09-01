import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { StorageModule } from '../storage/storage.module';
import { VerificationMethodService } from './verification-method/verification-method.service';

export const IdentityModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    StorageModule
  ],
  controllers: [
    IdentityController
  ],
  providers: [
    IdentityService,
    VerificationMethodService
  ],
  exports: [
    IdentityService,
    VerificationMethodService
  ],
};

@Module(IdentityModuleConfig)
export class IdentityModule { }
