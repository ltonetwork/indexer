import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { LeveldbService } from './leveldb.service';

@Injectable()
export class LeveldbListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly config: ConfigService,
    private readonly leveldbService: LeveldbService,
  ) { }

  async onModuleInit() {
    if (this.config.getStorageType() !== 'leveldb') {
      return;
    }

    await this.onIndexBlock();
  }

  async onIndexBlock() {
    this.indexEmitter.on(
      IndexEvent.IndexBlock,
      () => this.leveldbService.flush(),
    );
  }
}
