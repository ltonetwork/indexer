import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { StorageService } from '../../storage/storage.service';
import { VerificationMethod } from './model/verification-method.model';
import { RelationshipType } from './model/verification-method.types';

@Injectable()
export class VerificationMethodService {
  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) {}

  async getMethodsFor(address: string, versionTime?: Date): Promise<VerificationMethod[]> {
    const versionTimestamp = versionTime?.getTime() ?? Date.now();

    const methods = (await this.storage.getVerificationMethods(address))
      .sort((a, b) => b.timestamp - a.timestamp);
    const map = new Map<string, VerificationMethod>();

    methods.unshift(new VerificationMethod(0x11f, address, versionTimestamp));

    for (const method of methods) {
      if (method.timestamp <= versionTimestamp) map.set(method.recipient, method);
    }

    return Array.from(map.values()).filter((method) => method.isActive(versionTimestamp));
  }

  private getTypeForRelationship(methods: Record<string, boolean>): number {
    return Object.entries(methods)
      .filter(([relationship, value]) => relationship in RelationshipType && value)
      .map(([relationship]) => RelationshipType[relationship])
      .reduce((a, b) => a | b, 0x100);
  }

  async save(
    type: number,
    sender: string,
    recipient: string,
    data: Record<string, boolean>,
    timestamp: number,
    expires?: number,
  ): Promise<void> {
    type = type | this.getTypeForRelationship(data);
    const verificationMethod = new VerificationMethod(type, recipient, timestamp, expires);

    this.logger.debug(`DID: 'did:lto:${sender}' add verification method '${recipient}'`);
    await this.storage.saveVerificationMethod(sender, verificationMethod);
  }

  async revoke(sender: string, recipient: string, timestamp: number): Promise<void> {
    const verificationMethod = new VerificationMethod(0, recipient, timestamp);

    this.logger.debug(`DID: 'did:lto${sender}' revoke verification method '${recipient}'`);
    await this.storage.saveVerificationMethod(sender, verificationMethod);
  }
}
