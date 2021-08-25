import { Injectable, OnModuleInit } from '@nestjs/common';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { StatsService } from './stats.service';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class StatsListenerService implements OnModuleInit {

  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly statsService: StatsService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  onModuleInit() {
    const opsEnabled = this.config.isStatsEnabled('operations');
    const txEnabled = this.config.isStatsEnabled('transactions');
    const supplyEnabled = this.config.isStatsEnabled('supply');

    if (!opsEnabled && !txEnabled && !supplyEnabled) {
      this.logger.debug(`transaction-listener: Not processing stats`);
      return;
    }

    this.onIndexTransaction();
  }
  async onIndexTransaction() {
    this.indexEmitter.on(
      IndexEvent.IndexTransaction,
      (val: IndexEventsReturnType['IndexTransaction']) => this.statsService.index(val),
    );
  }
}
