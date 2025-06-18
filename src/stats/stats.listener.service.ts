import { Injectable, OnModuleInit } from '@nestjs/common';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { StatsService } from './stats.service';
import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class StatsListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly statsService: StatsService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    if (!this.config.isStatsEnabled()) {
      this.logger.debug(`stats-listener: Not processing stats`);
      return;
    }

    this.onIndexBlock();
  }

  onIndexBlock() {
    this.indexEmitter.on(IndexEvent.IndexBlock, (val: IndexEventsReturnType['IndexBlock']) =>
      this.statsService.index(val),
    );
  }
}
