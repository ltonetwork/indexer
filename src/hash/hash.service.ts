import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HashEncoder } from './classes/hash.encoder';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { NodeService } from '../node/node.service';
import { RedisService } from '../redis/redis.service';
import { RedisConnection } from '../redis/classes/redis.connection';

@Injectable()
export class HashService implements OnModuleInit, OnModuleDestroy {
  public encoder: HashEncoder;
  public connection: RedisConnection;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly node: NodeService,
    private readonly redis: RedisService,
  ) {
    this.encoder = new HashEncoder();
  }

  async onModuleInit() { }

  async onModuleDestroy() { }

  async init() {
    this.connection = await this.redis.connect(this.config.getRedisClient());
  }

  async anchor(hash: string, encoding: string): Promise<{ '@context', type, targetHash, anchors } | null> {
    await this.init();

    this.logger.debug(`hash: starting anchoring '${hash}' as '${encoding}'`);

    try {
      const senderAddress = await this.node.getNodeWallet();
      const base64Hash = this.encoder.base64Encode(this.encoder.decode(hash, encoding));
      const transactionId = await this.node.createAnchorTransaction(senderAddress, base64Hash);

      if (!transactionId) {
        this.logger.warn(`hash: anchoring '${hash}' as '${encoding}' resulted in no transaction id`);
        return null;
      }

      this.logger.info(`hash: successfully anchored '${hash}' as '${encoding}' in transaction '${transactionId}'`);
      return this.asChainPoint(hash, transactionId);
    } catch (e) {
      this.logger.error(`hash: failed anchoring '${hash}' as '${encoding}'`);
      throw e;
    }
  }

  async getTransactionByHash(hash: string): Promise<{ '@context', type, targetHash, anchors } | null> {
    await this.init();

    this.logger.debug(`hash: getting transaction by hash '${hash}'`);

    try {
      let transactionId = await this.connection.get(`lto-anchor:anchor:${hash.toLowerCase()}`);

      if (!transactionId) {
        const encoded = this.encoder.base64Encode(this.encoder.decode(hash, 'hex'));
        transactionId = await this.node.getUnconfirmedAnchor(encoded);
      }

      if (!transactionId) {
        this.logger.warn(`hash: getting '${hash}' resulted in no transaction id`);
        return null;
      }

      this.logger.info(`hash: successfully got transaction '${transactionId}' by hash '${hash}'`);
      return this.asChainPoint(hash, transactionId);
    } catch (e) {
      this.logger.error(`hash: failed getting transaction by hash '${hash}'`);
      throw e;
    }
  }

  asChainPoint(hash: string, transactionId: string) {
    return {
      '@context': 'https://w3id.org/chainpoint/v2',
      'type': 'ChainpointSHA256v2',
      'targetHash': hash,
      'anchors': [{
        type: 'LTODataTransaction',
        sourceId: transactionId,
      }],
    };
  }
}
