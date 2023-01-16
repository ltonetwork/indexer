import { Injectable, OnModuleInit } from '@nestjs/common';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import {GeneratorService} from './generator.service';

@Injectable()
export class StatsListenerService implements OnModuleInit {

  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly generatorService: GeneratorService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  onModuleInit() {
    if (!this.config.isGeneratorIndexingEnabled()) {
      this.logger.debug(`generator-listener: Not processing`);
      return;
    }

    this.indexEmitter.on(IndexEvent.IndexSync, (val: IndexEventsReturnType['IndexSync']) => {
      this.generatorService.calculate(val);
      this.onIndexBlock();
    });
  }

  onIndexBlock() {
    this.indexEmitter.on(
      IndexEvent.IndexBlock,
      (val: IndexEventsReturnType['IndexBlock']) => this.generatorService.update(val),
    );
  }
}