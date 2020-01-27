import { Module } from '@nestjs/common';
import { transactionProviders } from './transaction.providers';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { NodeModule } from '../node/node.module';
import { TransactionListenerService } from './transaction-listener.service';
import { EmitterModule } from '../emitter/emitter.module';

export const TransactionModuleConfig = {
  imports: [LoggerModule, ConfigModule, NodeModule, EmitterModule],
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
