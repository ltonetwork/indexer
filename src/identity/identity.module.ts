import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { StorageModule } from '../storage/storage.module';

export const DidModuleConfig = {
  imports: [LoggerModule, ConfigModule, StorageModule],
  controllers: [IdentityController],
  providers: [IdentityService],
};

@Module(DidModuleConfig)
export class IdentityModule { }
