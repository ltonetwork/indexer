import { Injectable } from '@nestjs/common';
import TransactionTypes from './const/types.const';
import { IndexDocumentType } from '../index/model/index.model';
import { LoggerService } from '../common/logger/logger.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TransactionService {
  constructor(private readonly logger: LoggerService, private readonly storage: StorageService) {}

  getAllTypes(): Array<{ id: string; types?: number[] }> {
    return Object.keys(TransactionTypes).map((k) => TransactionTypes[k]);
  }

  getIdentifiers(): string[] {
    const types = this.getAllTypes();
    return types.map((tx) => tx.id);
  }

  getIdentifierByType(type: number): string | null {
    const types = this.getAllTypes();
    const match = types.find((tx) => tx.types?.includes(type));
    return match ? match.id : null;
  }

  getIdentifiersByType(type: number): string[] {
    const types = this.getAllTypes();
    return types.filter((tx) => tx.types?.includes(type)).map((match) => match.id);
  }

  hasIdentifier(identifier): boolean {
    const identifiers = this.getIdentifiers();
    return identifiers.indexOf(identifier) > -1;
  }

  async getStats(type: string, from: number, to: number): Promise<{ period: string; count: number }[]> {
    return this.storage.getTxStats(type, from, to);
  }

  async index(index: IndexDocumentType) {
    const { transaction } = index;
    const identifiers = [...this.getIdentifiersByType(transaction.type), 'all'];
    const promises = [] as Promise<any>[];

    if (identifiers.length === 0) {
      return false;
    }

    this.logger.debug(`transaction ${transaction.id}: ` + identifiers.join(' '));

    for (const identifier of identifiers) {
      if (transaction.sender) {
        promises.push(this.storage.indexTx(identifier, transaction.sender, transaction.id, transaction.timestamp));
      }

      if (transaction.recipient) {
        promises.push(this.storage.indexTx(identifier, transaction.recipient, transaction.id, transaction.timestamp));
      }

      if (transaction.transfers) {
        for (const transfer of transaction.transfers) {
          promises.push(this.storage.indexTx(identifier, transfer.recipient, transaction.id, transaction.timestamp));
        }
      }
    }

    await Promise.all(promises);

    return true;
  }
}
