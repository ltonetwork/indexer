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

  async getOperationStats(from: number, to: number): Promise<{ period: string; count: number }[]> {
    return this.storage.getOperationStats(from, to);
  }

  async incrOperationStats(transaction: Transaction): Promise<void> {
    const identifiers = this.transactionService.getIdentifiersByType(transaction.type);

    const iterations = identifiers.indexOf('anchor') >= 0
      ? Math.min(this.anchorService.getAnchorHashes(transaction).length, 1)
      : (transaction.transfers?.length || 1);

    this.logger.debug(`operation stats: ${iterations} transfers: increase stats: ${transaction.id}`);

    await this.storage.incrOperationStats(Math.floor(transaction.timestamp / 86400000), iterations);
  }
}
