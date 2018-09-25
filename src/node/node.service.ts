import { Injectable } from '@nestjs/common';
import { NodeApiService } from './node-api.service';

@Injectable()
export class NodeService {
  constructor(
    private readonly api: NodeApiService,
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

  async getBlock(id: string | number): Promise<object> {
    const response = await this.api.getBlock(id);

    if (response instanceof Error) {
      throw response;
    }

    return response.data;
  }

  async createAnchorTransaction(senderAddress: string, hash: string): Promise<string> {
    const response = await this.api.sendTransaction({
      version: 1,
      type: 12,
      sender: senderAddress,
      data: [
        { key: '\u2693', type: 'binary', value: `base64:${hash}` },
      ],
      fee: 100000,
      timestamp: Date.now(),
    });

    if (response instanceof Error) {
      throw response;
    }

    return response.data.id;
  }
}
