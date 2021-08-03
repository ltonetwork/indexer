import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { EncoderService } from '../encoder/encoder.service';
import { NodeService } from '../node/node.service';
import { StorageService } from '../storage/storage.service';
import delay from 'delay';
import { Block } from '../transaction/interfaces/block.interface';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { IndexService } from './index.service';

@Injectable()
export class IndexMonitorService {

  public processing: boolean;
  public lastBlock: number;
  public started: boolean;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly encoder: EncoderService,
    private readonly node: NodeService,
    private readonly storage: StorageService,
    private readonly indexer: IndexService,
  ) {}

  async start() {
    try {
      this.logger.info(`index-monitor: starting monitor`);

      if (this.started) {
        return this.logger.warn('index-monitor: monitor already running');
      }

      this.lastBlock = this.config.getNodeStartingBlock() === 'last' ?
        await this.node.getLastBlockHeight() :
        this.config.getNodeStartingBlock() as number;
      if (this.config.getNodeRestartSync()) {
        // @todo: perhaps need to clean entire database? redis + leveldb
        await this.storage.clearProcessHeight();
      }
      await this.process();
      this.started = true;
    } catch (e) {
      this.processing = false;
      this.logger.error(`index-monitor: failed to start monitor: ${e}`);
      this.started = false;
      await delay(2000);
      return this.start();
      throw e;
    }
  }

  async process() {
    if (!this.processing) {
      await this.checkNewBlocks();
    }

    await delay(this.config.getMonitorInterval());
    return this.process();
  }

  async isSynced(): Promise<boolean> {
    try {
      const resp = await this.node.getNodeStatus();
      if (resp && resp.blockchainHeight) {
        const processingHeight = await this.storage.getProcessingHeight();
        return (resp.blockchainHeight - 1) <= processingHeight;
      }
    } catch (e) {
      return false;
    }

    return false;
  }

  async checkNewBlocks() {
    this.processing = true;

    const blockHeight = await this.node.getLastBlockHeight();
    const processingHeight =
      (await this.storage.getProcessingHeight()) || this.lastBlock;
    const ranges = this.node.getBlockRanges(processingHeight, blockHeight);

    for (const range of ranges) {
      this.logger.info(
        `index-monitor: processing blocks ${range.from} to ${range.to}`,
      );
      const blocks = await this.node.getBlocks(range.from, range.to);

      for (const block of blocks) {
        await this.processBlock(block);
      }

      await this.storage.saveProcessingHeight(range.to);
    }

    this.processing = false;
  }

  async processBlock(block: Block) {
    // @todo: remove comment
    // this.logger.debug(`index-monitor: processing block ${block.height}`);

    let position = 0;

    for (const transaction of block.transactions) {
      await this.processTransaction(transaction, block.height, position);
      position++;
    }
  }

  processTransaction(
    transaction: Transaction,
    blockHeight: number,
    position: number,
  ) {
    return this.indexer.index({transaction, blockHeight, position });
  }
}
