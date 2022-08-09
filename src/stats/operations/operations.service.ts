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

    const iterations =
        transaction.type === 15 ? Math.max(transaction.anchors.length, 1) :
        transaction.type === 11 ? transaction.transfers.length :
        1;

    this.logger.debug(`increase operation stats by ${iterations}: ${transaction.id}`);

    await this.storage.incrOperationStats(Math.floor(transaction.timestamp / 86400000), iterations);
  }
}
