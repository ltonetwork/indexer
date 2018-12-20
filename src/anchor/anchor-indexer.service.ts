import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { LoggerService } from '../logger/logger.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class AnchorIndexerService {
  public lastBlock: number;
  public txCache: string[];

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
    private readonly tx: TransactionService,
  ) {
  }

  /**
   * Index transaction, returns boolean based on whether or not transaction was successful
   * Transaction may be skipped if its already processed
   *
   * @param transaction
   * @param blockHeight
   */
  async index(transaction: Transaction, blockHeight: number): Promise<boolean> {
    if (this.lastBlock !== blockHeight) {
      this.txCache = [];
    }

    this.lastBlock = blockHeight;

    if (this.txCache.indexOf(transaction.id) > -1) {
      // transaction is already processed
      return false;
    }

    this.txCache.push(transaction.id);

    const identifier = this.tx.getIdentifierByType(transaction.type);

    if (!identifier) {
      return false;
    }

    if (transaction.sender) {
      this.logger.debug(`anchor: index ${identifier} transaction ${transaction.id} for ${transaction.sender}`);
      await this.storage.indexTx(identifier, transaction.sender, transaction.id);
    }

    if (transaction.recipient) {
      this.logger.debug(`anchor: index ${identifier} transaction ${transaction.id} for ${transaction.recipient}`);
      await this.storage.indexTx(identifier, transaction.recipient, transaction.id);
    }

    if (transaction.transfers) {
      for (const transfer of transaction.transfers) {
        this.logger.debug(`anchor: index ${identifier} transaction ${transaction.id} for ${transfer.recipient}`);
        await this.storage.indexTx(identifier, transfer.recipient, transaction.id);
      }
    }

    return true;
  }
}
