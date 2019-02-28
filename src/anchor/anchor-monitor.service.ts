import { Injectable } from '@nestjs/common';
import { AnchorIndexerService } from './anchor-indexer.service';
import { EncoderService } from '../encoder/encoder.service';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { NodeService } from '../node/node.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { Block } from '../transaction/interfaces/block.interface';
import delay from 'delay';

@Injectable()
export class AnchorMonitorService {
  public processing: boolean;
  public lastBlock: number;
  public transactionTypes: Array<number>;
  public anchorToken: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly encoder: EncoderService,
    private readonly node: NodeService,
    private readonly storage: StorageService,
    private readonly indexer: AnchorIndexerService,
  ) {
    this.transactionTypes = [12, 15];
    this.anchorToken = '\u2693';
  }

  async start() {
    try {
      this.lastBlock = this.config.getNodeStartingBlock() === 'last' ?
        await this.node.getLastBlockHeight() :
        this.config.getNodeStartingBlock() as number;
      if (this.config.getNodeRestartSync()) {
        await this.storage.clearProcessHeight();
      }
      await this.process();
    } catch (e) {
      this.processing = false;
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
    } catch(e) {
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
        `anchor: processing blocks ${range.from} to ${range.to}`,
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
    this.logger.debug(`anchor: processing block ${block.height}`);

    let position = 0;

    for (const transaction of block.transactions) {
      await this.processTransaction(transaction, block.height, position);
      position++;
    }
  }

  async processTransaction(
    transaction: Transaction,
    blockHeight: number,
    position: number,
  ) {
    const success = await this.indexer.index(transaction, blockHeight);

    if (!success) {
      // transaction may be already processed
      return;
    }

    const skip =
      !transaction || this.transactionTypes.indexOf(transaction.type) === -1;

    if (skip) {
      return;
    }

    // @todo: move this to anchor-indexer service
    // Process old data transactions
    if (transaction.type === 12 && !!transaction.data) {
      for (const item of transaction.data) {
        if (item.key === this.anchorToken) {
          const value = item.value.replace('base64:', '');
          const hexHash = this.encoder.hexEncode(
            this.encoder.base64Decode(value),
          );
          this.logger.info(
            `anchor: save hash ${hexHash} with transaction ${transaction.id}`,
          );
          await this.storage.saveAnchor(hexHash, {
            id: transaction.id,
            blockHeight,
            position,
          });
        }
      }
    } else if (transaction.type === 15 && !!transaction.anchors) {
      transaction.anchors.forEach(async anchor => {
        const hexHash = this.encoder.hexEncode(
          this.encoder.base58Decode(anchor),
        );
        this.logger.info(
          `anchor: save hash ${hexHash} with transaction ${transaction.id}`,
        );
        await this.storage.saveAnchor(hexHash, {
          id: transaction.id,
          blockHeight,
          position,
        });
      });
    }
  }
}
