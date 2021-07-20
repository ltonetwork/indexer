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

  async index(index: IndexDocumentType) {
    const { transaction } = index;

    if (this.transactionTypes.indexOf(transaction.type) === -1){
      return ;
    }

    // @todo: make it so that association type doesn't matter for indexing
    // @todo: add config for indexing `none`, `trust` or `all` associations

    this.logger.debug(`association-service: Indexing association`);

    if (transaction.type === 16) {
      return this.createAssocIndex(transaction);
    } else if (transaction.type === 17) {
      return this.removeAssocIndex(transaction);
    }
  }

  // @todo: do this on index method instead and remove createAssocIndex
  async createAssocIndex(transaction: Transaction) {

    const {sender, associationType} = transaction;

    if (this.config.getAssociationTypes().indexOf(associationType) === -1) {
      this.logger.debug(`Ingoring association because unknown type ${associationType}`);
      return;
    }

    const associations = await this.storage.getAssociations(sender);
    if (sender === this.config.getAssociationsRoot() || associations.parents.length > 0) {
      this.storage.saveAssociation(transaction);
    } else {
      this.logger.debug(`association-service: Ignoring because sender not root or unregistered provider`);
    }
  }

  // @todo: do this on index method instead and remove removeAssocIndex
  async removeAssocIndex(transaction: Transaction) {
    const {sender, associationType} = transaction;

    if (this.config.getAssociationTypes().indexOf(associationType) === -1) {
      this.logger.debug(`Ingoring association because unknown type ${associationType}`);
      return;
    }

    const associations = await this.storage.getAssociations(sender);
    if (sender === this.config.getAssociationsRoot() || associations.parents.length > 0) {
      this.storage.removeAssociation(transaction);
    } else {
      this.logger.debug(`association-service: Ignoring because sender not root or unregistered provider`);
    }
  }

  getAssociations(address: string): Promise<any> {
    return this.storage.getAssociations(address);
  }
}
