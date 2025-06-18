import { Injectable } from '@nestjs/common';

import { SupplyService } from './supply/supply.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';
import { TransactionService } from '../transaction/transaction.service';
import { Block } from '../interfaces/block.interface';
import { NodeService } from '../node/node.service';

interface ConfigurationOptions {
  operations?: boolean;
  transactions?: boolean;
  supply?: boolean;
  lease?: boolean;
}

@Injectable()
export class StatsService {
  private operationsEnabled: boolean;
  private transactionsEnabled: boolean;
  private supplyEnabled: boolean;
  private leaseEnabled: boolean;

  constructor(
    private readonly storage: StorageService,
    private readonly transactionService: TransactionService,
    private readonly config: ConfigService,
    private readonly supplyService: SupplyService,
    private readonly node: NodeService,
  ) {
    this.configure({
      operations: this.config.isStatsEnabled('operations'),
      transactions: this.config.isStatsEnabled('transactions'),
      supply: this.config.isStatsEnabled('supply'),
      lease: this.config.isStatsEnabled('lease'),
    });
  }

  configure(options: ConfigurationOptions) {
    if ('operations' in options) this.operationsEnabled = options.operations;
    if ('transactions' in options) this.transactionsEnabled = options.transactions;
    if ('supply' in options) this.supplyEnabled = options.supply;
    if ('lease' in options) this.leaseEnabled = options.lease;
  }

  private calculateTxStats(block: Block) {
    if (!this.operationsEnabled && !this.transactionsEnabled) {
      return { txsByType: {}, operations: 0 };
    }

    const txsByType = { all: 0 };
    let operations = 0;

    for (const identifier of this.transactionService.getIdentifiers()) {
      txsByType[identifier] = 0;
    }

    txsByType.all = block.transactionCount;

    for (const transaction of block.transactions) {
      if (this.operationsEnabled) {
        operations +=
          transaction.type === 15
            ? (transaction.anchors as string[]).length || 1
            : transaction.type === 22
            ? Object.values(transaction.anchors as object).length || 1
            : transaction.type === 11
            ? transaction.transfers.length
            : 1;
      }

      if (this.transactionsEnabled) {
        const identifiers = this.transactionService.getIdentifiersByType(transaction.type);
        for (const identifier of identifiers) {
          txsByType[identifier]++;
        }
      }
    }

    return { txsByType, operations };
  }

  private async calculateLease(block: Block): Promise<{ in: number; out: number }> {
    const amountIn = block.transactions.filter((tx) => tx.type === 8).reduce((a, b) => a + b.amount, 0);

    const promises = block.transactions.filter((tx) => tx.type === 9).map((tx) => this.node.getTransaction(tx.leaseId));
    const amountOut = (await Promise.all(promises)).reduce((a, b) => a + b.amount, 0);

    return { in: amountIn, out: amountOut };
  }

  async index(block: Block): Promise<void> {
    const { txsByType, operations } = this.calculateTxStats(block);

    const promises: Array<Promise<any>> = [];
    const day = Math.floor(block.timestamp / 86400000);

    if (this.transactionsEnabled) {
      for (const [identifier, amount] of Object.entries(txsByType)) {
        if (amount === 0) continue;
        promises.push(this.storage.incrTxStats(identifier, day, amount));
      }
    }

    if (this.operationsEnabled) {
      promises.push(this.storage.incrOperationStats(day, operations));
    }

    if (this.supplyEnabled) {
      promises.push(this.supplyService.incrTxFeeBurned(block.burnedFees));
    }

    if (this.leaseEnabled) {
      const { in: amountIn, out: amountOut } = await this.calculateLease(block);
      promises.push(this.storage.incrLeaseStats(day, amountIn, amountOut));
    }

    await Promise.all(promises);
  }

  async getOperationStats(from: number, to: number): Promise<{ period: string; count: number }[]> {
    return this.storage.getOperationStats(from, to);
  }

  async getLeaseStats(from: number, to: number): Promise<{ period: string; in: number; out: number }[]> {
    return this.storage.getLeaseStats(from, to);
  }
}
