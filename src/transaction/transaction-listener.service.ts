import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class TransactionListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly service: TransactionService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    if (!this.config.isTransactionIndexingEnabled()) {
      this.logger.debug(`transaction-listener: Not processing transactions`);
      return;
    }

    this.onIndexTransaction();
  }

  async onIndexTransaction() {
    this.indexEmitter.on(IndexEvent.IndexTransaction, (val: IndexEventsReturnType['IndexTransaction']) =>
      this.service.index(val),
    );
  }
}
