import { Injectable } from '@nestjs/common';
import { AnchorStorageService } from './anchor-storage.service';
import { Transaction } from './interfaces/transaction.interface';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AnchorIndexerService {
  public readonly ANCHOR_TRANSACTIONS = [12, 15];
  public readonly TRANSFER_TRANSACTIONS = [4, 11];

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: AnchorStorageService,
  ) {
  }

  async index(transaction: Transaction): Promise<void> {
    if (this.ANCHOR_TRANSACTIONS.indexOf(transaction.type) > -1) {
      return this.indexAnchorTx(transaction);
    }

    if (this.TRANSFER_TRANSACTIONS.indexOf(transaction.type) > -1) {
      return this.indexTransferTx(transaction);
    }
  }

  async indexAnchorTx(transaction: Transaction): Promise<void> {
    this.logger.debug(`anchor: index anchor transaction ${transaction.id} for ${transaction.sender}`);
    return await this.storage.indexAnchorTx(transaction.sender, transaction.id);
  }

  async indexTransferTx(transaction: Transaction): Promise<void> {
    if (transaction.sender) {
      this.logger.debug(`anchor: index transfer transaction ${transaction.id} for ${transaction.sender}`);
      await this.storage.indexTransferTx(transaction.sender, transaction.id);
    }

    if (transaction.recipient) {
      this.logger.debug(`anchor: index transfer transaction ${transaction.id} for ${transaction.recipient}`);
      await this.storage.indexTransferTx(transaction.recipient, transaction.id);
    }

    if (transaction.transfers) {
      for (const transfer of transaction.transfers) {
        this.logger.debug(`anchor: index transfer transaction ${transaction.id} for ${transfer.recipient}`);
        await this.storage.indexTransferTx(transfer.recipient, transaction.id);
      }
    }
  }
}
