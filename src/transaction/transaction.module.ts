import { Module } from '@nestjs/common';
import { transactionProviders } from './transaction.providers';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { LoggerModule } from '../common/logger/logger.module';
import { ConfigModule } from '../common/config/config.module';
import { NodeModule } from '../node/node.module';
import { TransactionListenerService } from './transaction-listener.service';
import { EmitterModule } from '../emitter/emitter.module';
import { StorageModule } from '../storage/storage.module';

export const TransactionModuleConfig = {
  imports: [LoggerModule, ConfigModule, NodeModule, EmitterModule, StorageModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionListenerService,
    ...transactionProviders,
  ],
  exports: [
    TransactionService,
    ...transactionProviders,
  ],
};

@Module(TransactionModuleConfig)
export class TransactionModule { }
