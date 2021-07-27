import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { StorageService } from '../../storage/storage.service';
import { AnchorService } from '../../anchor/anchor.service';
import { Transaction } from '../../transaction/interfaces/transaction.interface';
import { TransactionService } from '../../transaction/transaction.service';

@Injectable()
export class OperationsService {

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
    private readonly anchorService: AnchorService,
    private readonly transactionService: TransactionService,
  ) { }

  async getOperationStats(): Promise<string> {
    return this.storage.getOperationStats();
  }

  async incrOperationStats(transaction: Transaction): Promise<void> {
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
}
