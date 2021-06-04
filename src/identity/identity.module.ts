import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { StorageModule } from '../storage/storage.module';
import { VerificationMethodModule } from '../verification-method/verification-method.module';

export const DidModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule, VerificationMethodModule],
  controllers: [IdentityController],
  providers: [IdentityService],
};

@Module(DidModuleConfig)
export class IdentityModule { }
