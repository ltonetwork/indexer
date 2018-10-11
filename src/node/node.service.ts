import { Injectable } from '@nestjs/common';
import { NodeApiService } from './node-api.service';
import { LoggerService } from '../logger/logger.service';
import { EncoderService } from '../encoder/encoder.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';

@Injectable()
export class NodeService {
  constructor(
    private readonly api: NodeApiService,
    private readonly logger: LoggerService,
    private readonly encoder: EncoderService,
    private readonly storage: StorageService,
  ) { }

  async getNodeWallet(): Promise<string> {
    const response = await this.api.getNodeAddresses();

    if (response instanceof Error) {
      throw response;
    }

    if (!response.data.length) {
      throw new Error(`node: no addresses in node's wallet`);
    }

    return response.data[0];
  }

  async getUnconfirmedAnchor(hash: string): Promise<string | null> {
    const response = await this.api.getUnconfirmedTransactions();

    if (response instanceof Error) {
      throw response;
    }

    const unconfirmed = response.data.filter((transaction) => {
      if (transaction.type !== 12) {
        return false;
      }

      if (transaction.data.find((data) => data.value && data.value === `base64:${hash}`)) {
        return true;
      }

      return false;
    });

    if (unconfirmed.length === 0) {
      return null;
    }

    return unconfirmed.map(transaction => transaction.id)[0];
  }

  async getLastBlockHeight(): Promise<number> {
    const response = await this.api.getLastBlock();

    if (response instanceof Error) {
      throw response;
    }

    return response.data.height - 1;
  }

  async getBlock(id: string | number): Promise<{ height, transactions }> {
    const response = await this.api.getBlock(id);

    if (response instanceof Error) {
      throw response;
    }

    return response.data;
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const response = await this.api.getTransaction(id);

    if (response instanceof Error) {
      throw response;
    }

    return response.data;
  }

  async getTransactions(id: string[]): Promise<Transaction[] | null> {
    const promises = id.map((tx) => this.getTransaction(tx));
    return await Promise.all(promises);
  }

  async createAnchorTransaction(senderAddress: string, hash: string): Promise<string> {
    const response = await this.api.sendTransaction({
      version: 1,
      type: 15,
      sender: senderAddress,
      anchors: [
        hash
      ],
      fee: 100000,
      timestamp: Date.now(),
    });

    if (response instanceof Error) {
      throw response;
    }

    return response.data.id;
  }

  async anchor(hash: string, encoding: string): Promise<{
    '@context', type, targetHash, anchors,
  } | null> {
    this.logger.debug(`hash: starting anchoring '${hash}' as '${encoding}'`);

    try {
      const senderAddress = await this.getNodeWallet();
      const base58Hash = this.encoder.base58Encode(this.encoder.decode(hash, encoding));
      const transactionId = await this.createAnchorTransaction(senderAddress, base58Hash);

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

  async getTransactionByHash(hash: string, encoding?: string): Promise<{
    '@context', type, targetHash, anchors,
  } | null> {
    const hashEncoded = encoding ? this.encoder.hexEncode(this.encoder.decode(hash, encoding)) : hash;
    let transactionId = await this.storage.getAnchor(hashEncoded);

    if (!transactionId) {
      const encoded = this.encoder.base64Encode(this.encoder.decode(hash, 'hex'));
      transactionId = await this.getUnconfirmedAnchor(encoded);
    }

    if (!transactionId) {
      return null;
    }

    return this.asChainPoint(hash, transactionId);
  }

  async getTransactionsByAddress(
    address: string,
    type: 'anchor' | 'transfer',
    limit: number = 25,
    offset: number = 0,
  ): Promise<string[]> {
    return await this.storage.getTx(type, address, limit, offset);
  }

  async countTransactionsByAddress(
    address: string,
    type: 'anchor' | 'transfer',
  ): Promise<number> {
    return await this.storage.countTx(type, address);
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
