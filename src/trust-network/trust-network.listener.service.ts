import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { TrustNetworkService } from './trust-network.service';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class TrustNetworkListenerService implements OnModuleInit {

  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly trustNetworkService: TrustNetworkService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  onModuleInit() {
    if (!this.config.isTrustNetworkIndexingEnabled()) {
      this.logger.debug(`transaction-listener: Not processing trust network`);
      return;
    }

    this.onIndexTransaction();
  }
  async onIndexTransaction() {
    this.indexEmitter.on(
      IndexEvent.IndexTransaction,
      (val: IndexEventsReturnType['IndexTransaction']) => this.trustNetworkService.index(val),
    );
  }
}
