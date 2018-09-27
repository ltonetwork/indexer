import { Injectable } from '@nestjs/common';
import { AnchorStorageService } from './anchor-storage.service';
import { HashService } from '../hash/hash.service';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { NodeService } from '../node/node.service';
import delay from 'delay';

@Injectable()
export class AnchorMonitorService {
  public processing: boolean;
  public lastBlock: number;
  public dataTransactionType: number;
  public anchorToken: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly hash: HashService,
    private readonly node: NodeService,
    private readonly storage: AnchorStorageService,
  ) {
    this.dataTransactionType = 12;
    this.anchorToken = '\u2693';
  }

  async start() {
    try {
      this.lastBlock = this.config.getNodeStartingBlock() === 'last' ?
        await this.node.getLastBlockHeight() :
        this.config.getNodeStartingBlock() as number;

      await this.process();
    } catch (e) {
      this.processing = false;
      throw e;
    }
  }

  async process() {
    if (!this.processing) {
      await this.checkNewBlock();
    }

    await delay(this.config.getMonitorInterval());
    return this.process();
  }

  async checkNewBlock() {
    this.processing = true;

    const currentHeight = await this.node.getLastBlockHeight();
    let lastHeight = (await this.storage.getProcessingHeight() || this.lastBlock) + 1;

    for (; lastHeight <= currentHeight; lastHeight++) {
      const block = await this.node.getBlock(lastHeight);
      await this.processBlock(block);
      await this.storage.saveProcessingHeight(lastHeight);
    }

    this.processing = false;
  }

  async processBlock(block: { height, transactions }) {
    this.logger.debug(`anchor: processing block ${block.height}`);

    for (const transaction of block.transactions) {
      await this.processTransaction(transaction);
    }
  }

  async processTransaction(transaction: { id, type, data: Array<{ key, value }> }) {
    const skip = !transaction ||
      transaction.type !== this.dataTransactionType ||
      typeof transaction.data === 'undefined';

    if (skip) {
      return;
    }

    for (const item of transaction.data) {
      if (item.key === this.anchorToken) {
        const value = item.value.replace('base64:', '');
        const hexHash = this.hash.encoder.hexEncode(this.hash.encoder.base64Decode(value));
        this.logger.info(`anchor: save hash ${hexHash} with transaction ${transaction.id}`);
        await this.storage.saveAnchor(hexHash, transaction.id);
      }
    }
  }
}
