import { Module } from '@nestjs/common';
import { IndexMonitorService } from './index-monitor.service';
import { IndexService } from './index.service';
import { EmitterModule } from '../emitter/emitter.module';
import { ConfigModule } from '../common/config/config.module';
import { NodeModule } from '../node/node.module';
import { StorageModule } from '../storage/storage.module';
import { EncoderModule } from '../common/encoder/encoder.module';
import { LoggerModule } from '../common/logger/logger.module';

export const IndexModuleConfig = {
  imports: [EmitterModule, ConfigModule, EncoderModule, NodeModule, StorageModule, LoggerModule],
  providers: [IndexMonitorService, IndexService],
  exports: [IndexMonitorService],
};

@Module(IndexModuleConfig)
export class IndexModule {}
