import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { Role, RoleData } from './interfaces/trust-network.interface';
import { ConfigService } from '../config/config.service';
import { NodeService } from '../node/node.service';

@Injectable()
export class TrustNetworkService {

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly node: NodeService
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

    const senderRoles = await this.getRolesFor(sender);
    
    const savedRoles: Role[] = [];

    senderRoles.issues_roles.forEach(eachRole => {
      if (eachRole.type === associationType && !savedRoles.includes(eachRole)) {
        savedRoles.push(eachRole);
        this.storage.saveRoleAssociation(recipient, sender, eachRole);
      }
    });
  }

  async getRolesFor(address: string): Promise<RoleData> {
    const result: RoleData = {
      roles: [],
      issues_roles: [],
      issues_authorization: [],
    };

    let roles;
    const configRoles = this.config.getRoles();

    const root = await this.node.getNodeWallet();

    if (root === address) {
      roles = { root: { } };
    } else {
      roles = await this.storage.getRolesFor(address);
    }

    for (const role in roles) {
      const configData = configRoles[role];
      
      if (configData) {
        result.roles.push(role);

        configData.issues?.forEach(eachIssues => {
          if (result.issues_roles.findIndex(each => each.role === eachIssues.role) === -1) {
            result.issues_roles.push(eachIssues);
          }
        });

        configData.authorization?.forEach(eachAuthorization => {
          if (result.issues_authorization.findIndex(each => each === eachAuthorization) === -1) {
            result.issues_authorization.push(eachAuthorization);
          }
        });
      }
    }

    return result;
  }
}
