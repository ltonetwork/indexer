import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TrustNetworkService {

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) {
  }

  // @todo: make the index method work
  async index(index: IndexDocumentType) {
    const { transaction } = index;
    const { id, sender, recipient } = transaction;

    if (!recipient) {
      this.logger.debug(`trustNetwork: transaction ${id} didn't have a recipient address, skipped indexing`);
      return;
    }
  }

  async getRoles(address: string) {
    // @todo: make method for resolving roles
    return {
      roles: ['authority', 'notary'],
      issues_roles: [
        { type: 100, role: 'notary' },
      ]
    };
  }
}
