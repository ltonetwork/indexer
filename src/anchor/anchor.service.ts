import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HashService } from '../hash/hash.service';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { RedisService } from '../redis/redis.service';
import { RedisConnection } from '../redis/classes/redis.connection';
import { NodeService } from '../node/node.service';

@Injectable()
export class AnchorService implements OnModuleInit, OnModuleDestroy {
  private connection: RedisConnection;
  private task: number;
  private taskId: number;
  private processing: boolean;
  private lastBlock: number;
  private dataTransactionType: number;
  private anchorToken: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly hash: HashService,
    private readonly node: NodeService,
    private readonly redis: RedisService,
  ) {
    this.dataTransactionType = 12;
    this.anchorToken = '\u2693';
  }

  async onModuleInit() { }

  async onModuleDestroy() {
    await this.close();
  }

  async start() {
    await this.init();

    if (this.task == null) {
      this.task = setTimeout(this.runMonitor.bind(this), 30000);
      this.logger.info(`Started processor`);
    } else {
      this.logger.warn('Processor already running');
    }
  }

  async init() {
    this.connection = await this.redis.connect(this.config.getRedisClient());

    if (this.config.getNodeStartingBlock() === 'last') {
      this.node.getLastBlockHeight().then((height) => {
        this.lastBlock = height;
      });
    } else {
      this.lastBlock = this.config.getNodeStartingBlock() as number;
    }

    this.processing = false;
  }

  async runMonitor() {
    this.taskId = setTimeout(this.runMonitor.bind(this), 30000);
    this.logger.debug('Run monitor');
    if (!this.processing) {
      await this.checkNewBlock();
    }
  }

  async checkNewBlock() {
    this.processing = true;
    try {
      const currentHeight = await this.node.getLastBlockHeight();
      let lastHeight = await this.getProcessingHeight() + 1;

      for (; lastHeight <= currentHeight; lastHeight++) {
        const block = await this.node.getBlock(lastHeight);
        await this.processBlock(block);
        await this.saveProcessingHeight(lastHeight);
      }
      this.logger.debug(`Processed blocks to block: ${lastHeight}`);
    } catch (e) {
      this.processing = false;
      throw e;
    }
    this.processing = false;
  }

  async stopMonitor() {
    clearTimeout(this.taskId);
  }

  async processBlock(block) {
    this.logger.debug(`Processing block: ${block.height}`);

    for (const transaction of block.transactions) {
      await this.processTransaction(transaction);
    }
  }

  async processTransaction(transaction) {
    const skip = !transaction ||
      transaction.type !== this.dataTransactionType ||
      typeof transaction.data === 'undefined';

    if (skip) return null;

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < transaction.data.length; i++) {
      const item = transaction.data[i];

      if (item.key === this.anchorToken) {
        const value = item.value.replace('base64:', '');
        const hexHash = this.hash.encoder.hexEncode(this.hash.encoder.base64Decode(value));
        await this.saveAnchor(hexHash, transaction.id);
      }
    }
  }

  async saveAnchor(hash, transactionId) {
    this.logger.info(`Save hash ${hash} with transactionId: ${transactionId}`);
    const key = `lto-anchor:anchor:${hash}`;
    return this.connection.set(key, transactionId);
  }

  async getProcessingHeight() {
    // tslint:disable-next-line:radix
    let height = parseInt(await this.connection.get(`lto-anchor:processing-height`));
    if (!height) {
      height = this.lastBlock;
    }

    return height;
  }

  async saveProcessingHeight(height) {
    return this.connection.set(`lto-anchor:processing-height`, height);
  }

  async close() {
    await this.connection.close();
  }
}
