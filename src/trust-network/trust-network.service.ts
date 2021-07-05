import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { Role, RoleData } from './interfaces/trust-network.interface';
import { ConfigService } from '../config/config.service';

@Injectable()
export class TrustNetworkService {

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) { }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { id, sender, recipient, associationType } = transaction;
    
    if (!recipient) {
      this.logger.debug(`trustNetwork: transaction ${id} didn't have a recipient address, skipped indexing`);
      return;
    }

    if (!associationType) {
      this.logger.debug(`trustNetwork: transaction ${id} didn't have an association type, skipped indexing`);
      return;
    }

    // @todo: root is always the node
    const senderRoles = await this.getRolesFor(sender);
    
    const savedRoles: Role[] = [];

    senderRoles.issues_roles.forEach(eachRole => {
      if (eachRole.type === associationType && !savedRoles.includes(eachRole)) {
        savedRoles.push(eachRole);
        this.storage.saveTrustNetworkRole(recipient, sender, eachRole);
      }
    });
  }

  async getRolesFor(address: string): Promise<RoleData> {
    return this.storage.getTrustNetworkRoles(address);
  }
}
