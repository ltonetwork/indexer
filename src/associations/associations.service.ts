import { Injectable, OnModuleInit } from '@nestjs/common';
import { IndexDocumentType } from '../index/model/index.model';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { AssociationsGraphService } from './graph/associations-graph.service';

@Injectable()
export class AssociationsService {

  private transactionTypes: number[];

  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
    readonly associationsGraph: AssociationsGraphService,
  ) {
    this.transactionTypes = [16, 17];
  }

  async index(index: IndexDocumentType, associationIndexing: 'trust' | 'all'): Promise<void> {
    const { transaction } = index;
    const { sender } = transaction;

    if (this.transactionTypes.indexOf(transaction.type) === -1){
      this.logger.debug(`association-service: Unknown transaction type`);
      return;
    }

    if (associationIndexing === 'trust') {
      const senderRoles = await this.storage.getRolesFor(sender);
      const isSenderTrustNetwork = Object.keys(senderRoles).length > 0;

      if (!isSenderTrustNetwork) {
        this.logger.debug(`association-service: Sender is not part of trust network`);
        return;
      }
    }

    if (transaction.type === 16) {
      this.logger.debug(`association-service: Saving association`);
      return this.storage.saveAssociation(transaction);
    } else if (transaction.type === 17) {
      this.logger.debug(`association-service: Removing association`);
      return this.storage.removeAssociation(transaction);
    }
  }

  async getAssociations(address: string): Promise<any> {
    await this.associationsGraph.execute();

    return this.storage.getAssociations(address);
  }
}
