import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from './common/config/config.module';
import { LoggerModule } from './common/logger/logger.module';
import { InfoModule } from './info/info.module';
import { AnchorModule } from './anchor/anchor.module';
import { HashModule } from './hash/hash.module';
import { DIDModule } from './did/did.module';
import { NodeModule } from './node/node.module';
import { RedisModule } from './common/redis/redis.module';
import { RequestModule } from './common/request/request.module';
import { TransactionModule } from './transaction/transaction.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './common/auth/auth.module';
import { IndexModule } from './index/index.module';
import { EmitterModule } from './emitter/emitter.module';
import { AssociationsModule } from './associations/associations.module';
import { TrustNetworkModule } from './trust-network/trust-network.module';
import { StatsModule } from './stats/stats.module';
import { CredentialStatusModule } from './credential-status/credential-status.module';

export const AppModuleConfig = {
  imports: [
    LoggerModule,
    ConfigModule,
    RequestModule,
    InfoModule,
    HealthModule,
    AnchorModule,
    HashModule,
    DIDModule,
    CredentialStatusModule,
    NodeModule,
    RedisModule,
    TransactionModule,
    StorageModule,
    AuthModule,
    IndexModule,
    EmitterModule,
    AssociationsModule,
    TrustNetworkModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [],
};

@Module(AppModuleConfig)
export class AppModule {}
