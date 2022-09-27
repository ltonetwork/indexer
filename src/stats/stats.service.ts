import { Injectable } from '@nestjs/common';

import { SupplyService } from './supply/supply.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { TransactionService } from '../transaction/transaction.service';
import { Block } from '../transaction/interfaces/block.interface';

@Injectable()
export class StatsService {
  private readonly operationsEnabled: boolean;
  private readonly transactionsEnabled: boolean;
  private readonly supplyEnabled: boolean;

  constructor(
    private readonly storage: StorageService,
    private readonly transactionService: TransactionService,
    private readonly config: ConfigService,
    private readonly supplyService: SupplyService,
  ) {
    this.operationsEnabled = this.config.isStatsEnabled('operations');
    this.transactionsEnabled = this.config.isStatsEnabled('transactions');
    this.supplyEnabled = this.config.isStatsEnabled('supply');
  }

  async index(block: Block): Promise<void> {
    const txsByType = { all: 0 };
    let operations = 0;

    for (const identifier of this.transactionService.getIdentifiers()) {
      txsByType[identifier] = 0;
    }

    txsByType.all = block.transactionCount;

    for (const transaction of block.transactions) {
      if (this.operationsEnabled) {
        operations +=
            transaction.type === 15 ? (transaction.anchors.length || 1) :
            transaction.type === 11 ? transaction.transfers.length :
            1;
      }

      if (this.transactionsEnabled) {
        const identifiers = this.transactionService.getIdentifiersByType(transaction.type);
        for (const identifier of identifiers) {
          txsByType[identifier]++;
        }
      }
    }

    const promises: Array<Promise<any>> = [];
    const day = Math.floor(block.timestamp / 86400000);

    if (this.transactionsEnabled) {
      for (const [identifier, amount] of Object.entries(txsByType)) {
        promises.push(this.storage.incrTxStats(identifier, day, amount));
      }
    }

    if (this.operationsEnabled) {
      promises.push(this.storage.incrOperationStats(day, operations));
    }

    if (this.supplyEnabled) {
      promises.push(this.supplyService.incrTxFeeBurned(block.burnedFees));
    }

    await Promise.all(promises);
  }

  async getOperationStats(from: number, to: number): Promise<{ period: string; count: number }[]> {
    return this.storage.getOperationStats(from, to);
  }
}
