import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { EmitterService } from '../emitter/emitter.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AnchorService } from './anchor.service';

@Injectable()
export class AnchorListenerSerivce implements OnModuleInit {

  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly anchorService: AnchorService,
  ) { }

  onModuleInit() {
    this.onIndexTransaction();
  }

  async onIndexTransaction() {
    this.indexEmitter.on(
      IndexEvent.IndexTransaction,
      (val: IndexEventsReturnType['IndexTransaction']) => this.anchorService.index(val),
    );
  }
}
