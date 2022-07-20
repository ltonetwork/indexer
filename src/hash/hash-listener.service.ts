import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HashService } from './hash.service';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class HashListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly hashService: HashService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  onModuleInit() {
    if (!this.config.isAnchorBatched()) {
      this.logger.debug(`hash-listener: Not batching anchors`);
      return;
    }

    this.onIndexBlock();
  }

  async onIndexBlock() {
    this.indexEmitter.on(
      IndexEvent.IndexBlock,
      () => this.hashService.trigger(),
    );
  }
}
