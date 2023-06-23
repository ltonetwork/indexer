import { Injectable, OnModuleInit } from '@nestjs/common';

import { DidService } from './did.service';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';

@Injectable()
export class DidListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly didService: DidService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  async onModuleInit() {
    if (!this.config.isDIDIndexingEnabled()) {
      this.logger.debug(`transaction-listener: Not processing identities`);
      return;
    }

    this.indexEmitter.on(
      IndexEvent.IndexTransaction,
      (val: IndexEventsReturnType['IndexTransaction']) => this.didService.index(val),
    );
  }
}
