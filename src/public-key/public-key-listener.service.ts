import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PublicKeyService } from './public-key.service';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PublicKeyListenerService implements OnModuleInit {

  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly publicKeyService: PublicKeyService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  onModuleInit() {
    if (!this.config.isProcessorEnabled('public-key')) {
      this.logger.debug(`transaction-listener: Not processing public keys`);
      return;
    }
    this.onIndexTransaction();
  }

  async onIndexTransaction() {
    this.indexEmitter.on(
      IndexEvent.IndexTransaction,
      (val: IndexEventsReturnType['IndexTransaction']) => this.publicKeyService.index(val),
    );
  }
}
