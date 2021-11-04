import { Module } from '@nestjs/common';
import { AssociationsController } from './associations.controller';
import { AssociationsService } from './associations.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { AssociationsListenerService } from './associations-listener.service';
import { StorageModule } from '../storage/storage.module';
import { EmitterModule } from '../emitter/emitter.module';
import { TrustNetworkModule } from '../trust-network/trust-network.module';

export const AssociationsModuleConfig = {
  imports: [ConfigModule, LoggerModule, AuthModule, StorageModule, TrustNetworkModule, EmitterModule],
  controllers: [AssociationsController],
  providers: [AssociationsService, AssociationsListenerService],
};

@Module(AssociationsModuleConfig)
export class AssociationsModule {}
