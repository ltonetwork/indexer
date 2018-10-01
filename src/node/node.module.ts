import { Module } from '@nestjs/common';
import { nodeProviders } from './node.providers';
import { NodeService } from './node.service';
import { NodeApiService } from './node-api.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { RequestModule } from '../request/request.module';
import { EncoderModule } from '../encoder/encoder.module';
import { StorageModule } from '../storage/storage.module';

export const NodeModuleConfig = {
  imports: [LoggerModule, ConfigModule, RequestModule, EncoderModule, StorageModule],
  controllers: [],
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
