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

    this.logger.debug(`association-service: Indexing association`);

    if (transaction.type === 16) {
      return this.createAssocIndex(transaction);
    } else if (transaction.type === 17) {
      return this.removeAssocIndex(transaction);
    }
  }

  async createAssocIndex(transaction: Transaction) {

    const {sender, associationType} = transaction;

    if (this.config.getAssociationTypes().indexOf(associationType) === -1) {
      this.logger.info('Ingoring association because unknown type');
      return;
    }

    const associations = await this.storage.getAssociations(sender);
    if (sender === this.config.getAssociationsRoot() || associations.parents.length > 0) {
      this.storage.saveAssociation(transaction);
    } else {
      this.logger.debug(`association-service: Ignoring because sender ender not root or unregistered provider`);
    }
  }

  async removeAssocIndex(transaction: Transaction) {
    const {sender, associationType} = transaction;

    if (this.config.getAssociationTypes().indexOf(associationType) === -1) {
      this.logger.info('Ingoring association because unknown type');
      return;
    }

    const associations = await this.storage.getAssociations(sender);
    if (sender === this.config.getAssociationsRoot() || associations.parents.length > 0) {
      this.storage.removeAssociation(transaction);
    } else {
      this.logger.debug(`association-service: Ignoring because sender ender not root or unregistered provider`);
    }
  }

  getAssociations(address: string): Promise<any> {
    return this.storage.getAssociations(address);
  }
}
