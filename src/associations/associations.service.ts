import { Injectable } from '@nestjs/common';
import { IndexDocumentType } from '../index/model/index.model';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';

@Injectable()
export class AssociationsService {
  private transactionTypes: number[];

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    private readonly trust: TrustNetworkService,
  ) {
    this.transactionTypes = [16, 17];
  }

  async index(index: IndexDocumentType, associationIndexing: 'trust' | 'all'): Promise<void> {
    const { transaction } = index;
    const { sender, recipient, senderKeyType } = transaction;

    if (this.transactionTypes.indexOf(transaction.type) === -1) {
      this.logger.debug(`association-service: Unknown transaction type`);
      return;
    }

    // @todo: support multiple chains and key types (bip122 for example)
    if (this.config.isEip155IndexingEnabled() && senderKeyType !== 'sep256k1') {
      this.logger.debug(`association-service: Cross chain indexing is enabled, but the sender key type is unknown`);
      return;
    }

    if (!this.config.isEip155IndexingEnabled() && senderKeyType === 'sep256k1') {
      this.logger.debug(
        `association-service: Cross chain indexing is disabled, but sender key type is ${senderKeyType}`,
      );
      return;
    }

    if (associationIndexing === 'trust') {
      const senderRoles = await this.trust.getRolesFor(sender);
      const isSenderTrustNetwork = Object.keys(senderRoles.roles).length > 0;

      if (!isSenderTrustNetwork) {
        return;
      }
    }

    if (transaction.type === 16) {
      this.logger.debug(`association-service: Saving association`);
      return this.storage.saveAssociation(sender, recipient);
    } else if (transaction.type === 17) {
      this.logger.debug(`association-service: Removing association`);
      return this.storage.removeAssociation(sender, recipient);
    }
  }

  async getAssociations(address: string): Promise<any> {
    return this.storage.getAssociations(address);
  }
}
