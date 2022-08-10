import { Injectable } from '@nestjs/common';
import { IndexDocumentType } from './model/index.model';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from './index.events';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class IndexService {

  public lastBlock: number;
  public txCache: string[] = [];

  constructor(
    private readonly logger: LoggerService,
    private readonly event: EmitterService<IndexEventsReturnType>,
  ) { }

  /**
   * Index a new block. Should be called before indexing individual txs.
   *
   * @param height
   */
  async indexBlock(height: number) {
    this.txCache = [];
    this.event.emit(IndexEvent.IndexBlock, height);
  }

  /**
   * Index transaction, returns boolean based on whether or not transaction was successful
   * Transaction may be skipped if its already processed
   *
   * @param index
   */
  async index(index: IndexDocumentType): Promise<boolean> {
    if (this.txCache.indexOf(index.transaction.id) > -1) {
      // transaction is already processed
      return false;
    }

    this.txCache.push(index.transaction.id);

    this.logger.debug(`index-service: emitting index event`);

    this.event.emit(IndexEvent.IndexTransaction, index);

    return true;
  }
}
