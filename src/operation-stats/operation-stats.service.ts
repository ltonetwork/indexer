import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { TransactionService } from '../transaction/transaction.service';
import { AnchorService } from '../anchor/anchor.service';

@Injectable()
export class OperationStatsService {

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
    private readonly transactionService: TransactionService,
    private readonly anchorService: AnchorService,
  ) { }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;

    const identifiers = this.transactionService.getIdentifiersByType(transaction.type);

    if (identifiers.indexOf('anchor') >= 0) {
      const anchorHashes = this.anchorService.getAnchorHashes(transaction);

      this.logger.debug(`operation stats: ${anchorHashes.length} anchors: increase stats: ${transaction.id}`);

      anchorHashes.forEach(async hash => {
        await this.storage.incrOperationStats();
      });

      return;
    }

    const iterations = transaction.transfers?.length || 1;

    this.logger.debug(`operation stats: ${iterations} transfers: increase stats: ${transaction.id}`);

    for (let index = 0; index < iterations; index++) {
      await this.storage.incrOperationStats();
    }
  }

  async getOperationStats(): Promise<string> {
    return this.storage.getOperationStats();
  }

  async incrOperationStats(): Promise<void> {
    return this.storage.incrOperationStats();
  }
}
