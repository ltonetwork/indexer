import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';
import { CredentialStatusStatement } from './interfaces/credential-status.interface';
import { KeyType } from '../did/verification-method/verification-method.types';
import { isoDate } from '../utils/date';

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

  constructor(readonly logger: LoggerService, readonly config: ConfigService, readonly storage: StorageService) {}

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

  async getStatus(id: string): Promise<any> {
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

    return { id, statements };
  }
}
