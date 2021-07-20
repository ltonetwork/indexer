import { Injectable, OnModuleInit } from '@nestjs/common';
import { IndexDocumentType } from '../index/model/index.model';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';

@Injectable()
export class AssociationsService implements OnModuleInit {

  private transactionTypes: number[];
  private root: string;

  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
  ) {
    this.transactionTypes = [16, 17];
  }

  onModuleInit(): void {
    this.root = this.config.getAssociationsRoot();
  }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { sender } = transaction;

    if (this.transactionTypes.indexOf(transaction.type) === -1){
      this.logger.debug(`association-service: Unknown transaction type`);
      return;
    }

    const associationIndexing = this.config.getAssociationIndexing();
    const senderRoles = await this.storage.getRolesFor(sender);
    const isSenderNotTrustNetwork = Object.keys(senderRoles).length === 0;

    if (associationIndexing === 'none') {
      return;
    }

    if (associationIndexing === 'trust' && isSenderNotTrustNetwork) {
      return;
    }

    const associations = await this.storage.getAssociations(sender);

    if (sender !== this.config.getAssociationsRoot() || associations.parents.length <= 0) {
      this.logger.debug(`association-service: Sender not root or unregistered provider`);
      return;
    }

    if (transaction.type === 16) {
      this.logger.debug(`association-service: Saving association`);
      return this.storage.saveAssociation(transaction);
    } else if (transaction.type === 17) {
      this.logger.debug(`association-service: Removing association`);
      return this.storage.removeAssociation(transaction);
    } else {
      this.logger.debug(`association-service: Transaction not association type`);
    }
  }

  getAssociations(address: string): Promise<any> {
    return this.storage.getAssociations(address);
  }
}
