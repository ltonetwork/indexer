import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { RawRole, Role, RoleData } from './interfaces/trust-network.interface';
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

  private async checkIsAlreadySponsored(address: string): Promise<boolean> {
    const configRoles = this.config.getRoles();
    const roles = await this.storage.getRolesFor(address);
    let result = false;

    for (const role in roles) {
      if (!!configRoles[role]?.sponsored) {
        result = true;
        break;
      }
    }

    return result;
  }

  private async checkSponsoredRoles(savedRoles: Role[], recipient: string) {
    const isAlreadySponsored = await this.checkIsAlreadySponsored(recipient);

    if (isAlreadySponsored) {
      return;
    }

    const isGettingSponsored = savedRoles.reduce((previous, current, index) => {
      const each = savedRoles[index];
      const configRoles = this.config.getRoles();

      return !!configRoles[each.role]?.sponsored;
    }, false);

    if (!isGettingSponsored) {
      return;
    }

    try {
      this.logger.debug(`trust-network: party is being given a sponsored role, sending a transaction to the node`);
      await this.node.sponsor(recipient);
    } catch(error) {
      this.logger.error(`trust-network: error sending a transaction to the node: "${error}"`);
    }
  }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { id, sender, party, associationType } = transaction;
    
    if (!party) {
      this.logger.debug(`trust-network: transaction ${id} didn't have a party address, skipped indexing`);
      return;
    }

    if (!associationType) {
      this.logger.debug(`trust-network: transaction ${id} didn't have an association type, skipped indexing`);
      return;
    }

    const senderRoles = await this.getRolesFor(sender);

    const savedRoles: Role[] = [];

    senderRoles.issues_roles.forEach(async eachRole => {
      if (eachRole.type === associationType && !savedRoles.includes(eachRole)) {
        savedRoles.push(eachRole);
        await this.storage.saveRoleAssociation(party, sender, eachRole);
      }
    });

    if (savedRoles.length === 0) {
      return;
    }

    await this.checkSponsoredRoles(savedRoles, party);
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
