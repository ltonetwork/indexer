import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HashService } from '../hash/hash.service';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { RedisService } from '../redis/redis.service';
import { RedisConnection } from '../redis/classes/redis.connection';
import { NodeService } from '../node/node.service';
import delay from 'delay';

@Injectable()
export class AnchorService implements OnModuleInit, OnModuleDestroy {
  private connection: RedisConnection;
  private started: boolean;
  private processing: boolean;
  private lastBlock: number;
  private dataTransactionType: number;
  private anchorToken: string;
  private interval: number;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly hash: HashService,
    private readonly node: NodeService,
    private readonly redis: RedisService,
  ) {
    this.dataTransactionType = 12;
    this.anchorToken = '\u2693';
    this.interval = 10000;
  }

  async onModuleInit() { }

  async onModuleDestroy() {
    await this.close();
  }

  async init() {
    this.connection = await this.redis.connect(this.config.getRedisClient());
  }

  async start() {
    this.logger.info(`anchor: syncing with node`);

    if (this.started) {
      return this.logger.warn('anchor: processor already running');
    }

    try {
      this.started = true;
      await this.init();

      this.lastBlock = this.config.getNodeStartingBlock() === 'last' ?
        await this.node.getLastBlockHeight() :
        this.config.getNodeStartingBlock() as number;

      await this.checkNewBlock();

      await delay(this.interval);
      this.logger.info(`anchor: successfully synced with node`);
      await this.runMonitor();
    } catch (e) {
      this.logger.error(`anchor: failed to sync with node: ${e}`);
      this.started = false;
      this.processing = false;

      await delay(2000);
      return this.start();
    }
  }

  async runMonitor() {
    if (!this.processing) {
      await this.checkNewBlock();
    }

    await delay(this.interval);
    return this.runMonitor();
  }

  async checkNewBlock() {
    this.processing = true;

    const currentHeight = await this.node.getLastBlockHeight();
    let lastHeight = await this.getProcessingHeight() + 1;

    for (; lastHeight <= currentHeight; lastHeight++) {
      const block = await this.node.getBlock(lastHeight);
      await this.processBlock(block);
      await this.saveProcessingHeight(lastHeight);
    }

    this.processing = false;
  }

  async processBlock(block: { height, transactions }) {
    this.logger.debug(`anchor: processing block ${block.height}`);

    for (const transaction of block.transactions) {
      await this.processTransaction(transaction);
    }
  }

  async processTransaction(transaction: { id, type, data }) {
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
        await this.saveAnchor(hexHash, transaction.id);
      }
    }
  }

  async saveAnchor(hash, transactionId) {
    this.logger.info(`anchor: save hash ${hash} with transaction ${transactionId}`);
    return this.connection.set(`lto-anchor:anchor:${hash}`, transactionId);
  }

  async getProcessingHeight() {
    return Number((await this.connection.get(`lto-anchor:processing-height`)) || this.lastBlock);
  }

  async saveProcessingHeight(height) {
    return this.connection.set(`lto-anchor:processing-height`, height);
  }

  async close() {
    await this.connection.close();
  }
}
