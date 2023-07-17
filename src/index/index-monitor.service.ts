import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { EncoderService } from '../common/encoder/encoder.service';
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
    while (!this.started) {
      try {
        this.logger.info('index-monitor: starting monitor');

        if (this.config.getRestartSync()) {
          await this.storage.clearProcessHeight();
        }

        this.lastBlock = await this.storage.getProcessingHeight() || await this.initialProcessingHeight();
        this.started = true;

        await this.process();
      } catch (e) {
        this.processing = false;
        this.logger.error(`index-monitor: ${e}`);
        this.started = false;
        await delay(2000);
      }
    }
  }

  private async initialProcessingHeight() {
    return this.config.getStartingBlock() < 0
      ? await this.node.getLastBlockHeight()
      : this.config.getStartingBlock();
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
              processingHeight,
            },
          };
        }

        return {
          sync: true,
          message: 'Indexer is in sync',
          data: {
            nodeResponse: resp,
            processingHeight,
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
    const processingHeight = this.lastBlock;
    const ranges = this.node.getBlockRanges(processingHeight, blockHeight);

    for (const range of ranges) {
      if (range.from !== range.to) {
        this.logger.info(`index-monitor: processing blocks ${range.from} to ${range.to}`);
      } else {
        this.logger.debug(`index-monitor: processing block ${range.from}`);
      }

      const blocks = await this.node.getBlocks(range.from, range.to);

      for (const block of blocks) {
        await this.processBlock(block);
      }

      this.lastBlock = range.to;
      await this.storage.saveProcessingHeight(range.to);
    }

    this.processing = false;
  }

  async processBlock(block: Block) {
    let position = 0;

    await this.indexer.indexBlock(block);

    for (const transaction of block.transactions) {
      await this.processTransaction(transaction, block.height, position);
      position++;
    }
  }

  processTransaction(transaction: Transaction, blockHeight: number, position: number) {
    return this.indexer.indexTx({ transaction, blockHeight, position });
  }
}
