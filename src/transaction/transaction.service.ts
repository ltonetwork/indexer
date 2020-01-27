import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import TransactionTypes from './const/types.const';
import { IndexDocumentType } from '../index/model/index.model';
import { LoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) { }

  getAllTypes(): Array<{ id: string, types: number[] }> {
    const types = Object.keys(TransactionTypes).map((k) => TransactionTypes[k]);
    return types;
  }

  getIdentifiers(): string[] {
    const types = this.getAllTypes();
    return types.map((tx) => tx.id);
  }

  getIdentifierByType(type: number): string | null {
    const types = this.getAllTypes();
    const match = types.find((tx) => tx.types.indexOf(type) > -1);
    return match ? match.id : null;
  }

  getIdentifiersByType(type: number): string[] {
    const types = this.getAllTypes();
    const matches = types.filter((tx) => tx.types.indexOf(type) > -1).map((match) => match.id);
    return matches;
  }

  hasIdentifier(identifier): boolean {
    const identifiers = this.getIdentifiers();
    return identifiers.indexOf(identifier) > -1;
  }

  async index(index: IndexDocumentType) {
    const { transaction, blockHeight } = index;
    const identifiers = this.getIdentifiersByType(transaction.type);

    if (identifiers.length === 0) {
      return false;
    }

    for (const identifier of identifiers) {
      if (transaction.sender) {
        this.logger.debug(`transaction: index ${identifier} transaction ${transaction.id} for ${transaction.sender}`);
        await this.storage.indexTx(identifier, transaction.sender, transaction.id, transaction.timestamp);
      }

      if (transaction.recipient) {
        this.logger.debug(`transaction: index ${identifier} transaction ${transaction.id} for ${transaction.recipient}`);
        await this.storage.indexTx(identifier, transaction.recipient, transaction.id, transaction.timestamp);
      }

      if (transaction.transfers) {
        for (const transfer of transaction.transfers) {
          this.logger.debug(`transaction: index ${identifier} transaction ${transaction.id} for ${transfer.recipient}`);
          await this.storage.indexTx(identifier, transfer.recipient, transaction.id, transaction.timestamp);
        }
      }
    }

    return true;
  }
}
