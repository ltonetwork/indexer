import { Injectable } from '@nestjs/common';
import { IndexDocumentType } from './model/index.model';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from './index.events';
import { LoggerService } from '../logger/logger.service';
import { Block } from '../interfaces/block.interface';

@Injectable()
export class IndexService {

  public lastBlock: Block;
  public txCache: string[] = [];
  public isInSync: boolean = false;

  constructor(
    private readonly logger: LoggerService,
    private readonly event: EmitterService<IndexEventsReturnType>,
  ) { }

  /**
   * Signal that the indexer has caught up with the node.
   */
  async inSync(blockHeight: number) {
    if (this.isInSync) return;

    this.isInSync = true;
    this.logger.debug(`index-service: emitting in-sync event at block ${blockHeight}`);
    this.event.emit(IndexEvent.InSync, blockHeight);
  }

  /**
   * Index a new block. Should be called before indexing individual txs.
   */
  async indexBlock(block: Block) {
    if (!this.lastBlock) {
      this.lastBlock = block;
      return;
    }

    if (this.lastBlock.height !== block.height) {
      this.logger.debug(`index-service: emitting index event for block ${this.lastBlock.height}`);
      this.event.emit(IndexEvent.IndexBlock, this.lastBlock);
      this.txCache = [];
    }

    this.lastBlock = block;
  }

  /**
   * Index transaction, returns boolean based on whether indexing the transaction was successful
   * Transaction may be skipped if its already processed
   */
  async indexTx(index: IndexDocumentType): Promise<boolean> {
    if (this.txCache.indexOf(index.transaction.id) > -1) {
      // transaction is already processed
      return false;
    }

    this.txCache.push(index.transaction.id);

    this.logger.debug(`index-service: emitting index event for ${index.transaction.id}`);
    this.event.emit(IndexEvent.IndexTransaction, index);

    return true;
  }
}
