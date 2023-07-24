import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CredentialStatusListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    if (!this.config.isCredentialStatusIndexingEnabled()) {
      this.logger.debug(`credential-status-listener: Not processing credential status list`);
      return;
    }

    this.indexEmitter.on(IndexEvent.IndexTransaction, (val: IndexEventsReturnType['IndexTransaction']) =>
      this.index(val),
    );
  }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
  }
}
