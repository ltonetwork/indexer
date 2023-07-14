import { Module } from '@nestjs/common';
import { nodeProviders } from './node.providers';
import { NodeService } from './node.service';
import { NodeApiService } from './node-api.service';
import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';
import { RequestModule } from '../common/request/request.module';
import { EncoderModule } from '../common/encoder/encoder.module';
import { StorageModule } from '../storage/storage.module';
import { NodeController } from './node.controller';

export const NodeModuleConfig = {
  imports: [LoggerModule, ConfigModule, RequestModule, EncoderModule, StorageModule],
  controllers: [NodeController],
  providers: [
    ...nodeProviders,
    NodeService,
    NodeApiService,
  ],
  exports: [
    ...nodeProviders,
    NodeService,
    NodeApiService,
  ],
};

@Module(NodeModuleConfig)
export class NodeModule { }
