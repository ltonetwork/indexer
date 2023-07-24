import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CredentialStatusService {
  constructor(readonly logger: LoggerService, readonly config: ConfigService, readonly storage: StorageService) {}

  /*private async getAccountMap(
    statements: { sender: string }[],
  ): Promise<Map<string, >> {
    const promises = Array.from(new Set(statements.map((s) => s.sender))).map(
      async (address) => {
        const { keyType, publicKey } = await this.storage.getPublicKey(address);
      }
    );

  }*/

  async getStatus(subject: string): Promise<any> {
    const statements = await this.storage.getCredentialStatus(subject);

  }
}
