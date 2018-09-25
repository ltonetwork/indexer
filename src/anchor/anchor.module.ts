import { Module } from '@nestjs/common';
import { anchorProviders } from './anchor.providers';
import { AnchorService } from './anchor.service';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { HashModule } from '../hash/hash.module';
import { RedisModule } from '../redis/redis.module';
import { NodeModule } from '../node/node.module';

export const AnchorModuleConfig = {
  imports: [LoggerModule, ConfigModule, HashModule, NodeModule, RedisModule],
  controllers: [],
  providers: [
    ...anchorProviders,
    AnchorService,
  ],
  exports: [
    ...anchorProviders,
    AnchorService,
  ],
};

@Module(AnchorModuleConfig)
export class AnchorModule { }
