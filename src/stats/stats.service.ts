import { Injectable } from '@nestjs/common';

import { IndexDocumentType } from '../index/model/index.model';

import { SupplyService } from './supply/supply.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { OperationsService } from './operations/operations.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class StatsService {

  constructor(
    private readonly storage: StorageService,
    private readonly transactionService: TransactionService,
    private readonly config: ConfigService,
    private readonly supplyService: SupplyService,
    private readonly operationsService: OperationsService,
  ) { }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction, blockHeight } = index;

    const identifiers = this.transactionService.getIdentifiersByType(transaction.type);

    if (this.config.isStatsEnabled('operations')) {
      await this.operationsService.incrOperationStats(transaction);
    }

    if (this.config.isStatsEnabled('transactions')) {
      for (const identifier of identifiers) {
        await this.storage.incrTxStats(identifier, Math.floor(transaction.timestamp / 86400000));
      }
    }

    if (this.config.isStatsEnabled('supply')) {
      await this.supplyService.incrTxFeeBurned(blockHeight);
    }
  }
}
