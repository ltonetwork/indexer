import { Module } from '@nestjs/common';
import { redisProviders } from './redis.providers';
import { RedisService } from './redis.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';

export const RedisModuleConfig = {
  imports: [LoggerModule, ConfigModule],
  controllers: [],
  providers: [...redisProviders, RedisService],
  exports: [...redisProviders, RedisService],
};

@Module(RedisModuleConfig)
export class RedisModule {}
