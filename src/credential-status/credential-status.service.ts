import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';
import { CredentialStatus, CredentialStatusStatement } from './interfaces/credential-status.interface';
import { KeyType } from '../did/verification-method/verification-method.types';
import { isoDate } from '../utils/date';
import { DIDService } from '../did/did.service';

@Injectable()
export class CredentialStatusService {
  private statementTypes = new Map<number, string>([
    [0x10, 'issue'],
    [0x11, 'revoke'],
    [0x12, 'suspend'],
    [0x13, 'reinstate'],
    [0x14, 'dispute'],
    [0x15, 'acknowledge'],
  ]);

  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
    readonly didService: DIDService,
  ) {}

  private async getSenders(
    statements: { sender: string }[],
  ): Promise<Map<string, CredentialStatusStatement['signer']>> {
    const addresses = Array.from(new Set(statements.map((s) => s.sender)));

    const promises = addresses.map(async (address) => {
      const { keyType, publicKey } = (await this.storage.getPublicKey(address)) ?? {};
      return [
        address,
        {
          id: `did:lto:${address}#sign`,
          type: KeyType[keyType],
          publicKeyMultibase: 'z' + publicKey,
        },
      ] as [string, CredentialStatusStatement['signer']];
    });

    return new Map(await Promise.all(promises));
  }

  private async filterByIssuer(
    statements: CredentialStatusStatement[],
    issuerDID: string,
  ): Promise<CredentialStatusStatement[]> {
    const promises = statements.map(async (statement) => {
      if (statement.type === 'dispute' || statement.type === 'acknowledge') return statement;

      // TODO: This can be optimized. We don't need the whole DID document and it may not have changed.
      const issuer = await this.didService.resolveDocument(issuerDID, new Date(statement.timestamp));
      return issuer.assertionMethod.includes(statement.signer.id) ? statement : null;
    });

    return (await Promise.all(promises)).filter((s) => s);
  }

  async getStatus(id: string, issuer?: string): Promise<CredentialStatus> {
    const storedStatements = (await this.storage.getCredentialStatus(id)).sort((a, b) => a.timestamp - b.timestamp);
    const senders = await this.getSenders(storedStatements);

    const statements = storedStatements.map(({ sender, type, timestamp, ...data }) => {
      const signer = senders.get(sender);
      return {
        type: this.statementTypes.get(type),
        timestamp: isoDate(timestamp),
        signer,
        ...data,
      };
    });

    if (!issuer || statements.length === 0) {
      return { id, statements };
    }

    const filteredStatements = await this.filterByIssuer(statements, issuer);

    const issued = filteredStatements.find((s) => s.type === 'issue');
    const revoked = filteredStatements.find((s) => s.type === 'revoke');

    let suspended: CredentialStatusStatement | undefined;
    if (!revoked) {
      for (const statement of filteredStatements) {
        if (statement.type === 'revoke') break;
        if (!suspended && statement.type === 'suspend') suspended = statement;
        if (statement.type === 'reinstate') suspended = undefined;
      }
    }

    return {
      id,
      issuer,
      statements: filteredStatements,
      issued: issued?.timestamp,
      suspended: suspended?.timestamp,
      revoked: revoked?.timestamp,
    };
  }
}
