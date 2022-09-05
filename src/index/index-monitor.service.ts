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

      this.lastBlock =
        this.config.getStartingBlock() === 'last'
          ? await this.node.getLastBlockHeight()
          : (this.config.getStartingBlock() as number);
      if (this.config.getRestartSync()) {
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
    }
  }

  async process() {
    if (!this.processing) {
      await this.checkNewBlocks();
    }

    await delay(this.config.getMonitorInterval());
    return this.process();
  }

  async syncStatus(): Promise<{
    sync: boolean;
    message:
      | 'Blockchain height is higher than processing height'
      | 'Indexer is in sync'
      | 'Node response is invalid'
      | 'Error with node response';
    data: any;
  }> {
    try {
      const resp = await this.node.getNodeStatus();

      if (resp && resp.blockchainHeight) {
        const processingHeight = await this.storage.getProcessingHeight();
        const isInSync = resp.blockchainHeight - 1 <= processingHeight;

        if (!isInSync) {
          return {
            sync: false,
            message: 'Blockchain height is higher than processing height',
            data: {
              nodeResponse: resp,
              processingHeight: processingHeight,
            },
          };
        }

        return {
          sync: true,
          message: 'Indexer is in sync',
          data: {
            nodeResponse: resp,
            processingHeight: processingHeight,
          },
        };
      }

      return {
        sync: false,
        message: 'Node response is invalid',
        data: {
          nodeResponse: resp,
        },
      };
    } catch (error) {
      return {
        sync: false,
        message: 'Error with node response',
        data: {
          nodeResponse: error,
        },
      };
    }
  }

  async checkNewBlocks() {
    this.processing = true;

    const blockHeight = await this.node.getLastBlockHeight();
    const processingHeight = (await this.storage.getProcessingHeight()) || this.lastBlock;
    const ranges = this.node.getBlockRanges(processingHeight, blockHeight);

    for (const range of ranges) {
      this.logger.info(`index-monitor: processing blocks ${range.from} to ${range.to}`);
      const blocks = await this.node.getBlocks(range.from, range.to);

      for (const block of blocks) {
        await this.processBlock(block);
      }

      await this.storage.saveProcessingHeight(range.to);
      await this.storage.flush();
    }

    this.processing = false;
  }

  async processBlock(block: Block) {
    this.logger.debug(`index-monitor: processing block ${block.height}`);

    let position = 0;

    await this.indexer.indexBlock(block.height);

    for (const transaction of block.transactions) {
      await this.processTransaction(transaction, block.height, position);
      position++;
    }
  }

  processTransaction(transaction: Transaction, blockHeight: number, position: number) {
    return this.indexer.index({ transaction, blockHeight, position });
  }
}
