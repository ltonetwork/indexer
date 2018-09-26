import { Module } from '@nestjs/common';
import { hashProviders } from './hash.providers';
import { HashService } from './hash.service';
import { HashController } from './hash.controller';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { NodeModule } from '../node/node.module';
import { RedisModule } from '../redis/redis.module';

export const HashModuleConfig = {
  imports: [LoggerModule, ConfigModule, NodeModule, RedisModule],
  controllers: [HashController],
  providers: [
    ...hashProviders,
    HashService,
  ],
  exports: [
    ...hashProviders,
    HashService,
  ],
};

@Module(HashModuleConfig)
export class HashModule { }
