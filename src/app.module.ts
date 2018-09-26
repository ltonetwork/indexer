import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { InfoModule } from './info/info.module';
import { AnchorModule } from './anchor/anchor.module';
import { HashModule } from './hash/hash.module';
import { NodeModule } from './node/node.module';
import { RedisModule } from './redis/redis.module';
import { RequestModule } from './request/request.module';

export const AppModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    RequestModule,
    InfoModule,
    AnchorModule,
    HashModule,
    NodeModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
};

@Module(AppModuleConfig)
export class AppModule { }
