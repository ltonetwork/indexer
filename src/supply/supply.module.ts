import { Module } from '@nestjs/common';
import { SupplyService } from './supply.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { StorageModule } from '../storage/storage.module';
import { SupplyController } from './supply.controller';

export const SupplyModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    StorageModule,
  ],
  controllers: [SupplyController],
  providers: [
    SupplyService,
  ],
  exports: [
    SupplyService,
  ],
};

@Module(SupplyModuleConfig)
export class SupplyModule { }
