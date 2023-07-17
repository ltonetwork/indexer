import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class AssociationsListenerService implements OnModuleInit {
  private associationIndexing: 'none' | 'trust' | 'all';

  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly service: AssociationsService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    this.associationIndexing = this.config.getAssociationIndexing();

    if (this.associationIndexing === 'none') {
      this.logger.debug(`transaction-listener: Not processing associations: config set to "none"`);
      return;
    }

    this.onIndexTransaction();
  }

  async onIndexTransaction() {
    this.indexEmitter.on(IndexEvent.IndexTransaction, (val: IndexEventsReturnType['IndexTransaction']) =>
      this.service.index(val, this.associationIndexing as 'trust' | 'all'),
    );
  }
}
