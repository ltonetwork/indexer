import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import { StorageService } from '../../storage/storage.service';
import { VerificationMethod } from './model/verification-method.model';
import { RelationshipType } from './model/verification-method.types';

@Injectable()
export class VerificationMethodService {
  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) {}

  async getMethodsFor(address: string, versionTime?: Date | number): Promise<VerificationMethod[]> {
    const versionTimestamp = typeof versionTime === 'number' ? versionTime : versionTime?.getTime() ?? Date.now();

    const methods = (await this.storage.getVerificationMethods(address))
      .sort((a, b) => a.timestamp - b.timestamp);
    const map = new Map<string, VerificationMethod>();

    const defaultMethod = new VerificationMethod(0x11f, address, 0);
    methods.unshift(defaultMethod);

    for (const method of methods) {
      if (method.timestamp <= versionTimestamp) map.set(method.recipient, method);
    }

    if (!map.get(address).isActive(versionTimestamp)) map.set(address, defaultMethod);

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
    const relationships = sender === recipient ? 0x11f : 0;
    const verificationMethod = new VerificationMethod(relationships, recipient, timestamp);

    this.logger.debug(`DID: 'did:lto${sender}' revoke verification method '${recipient}'`);
    await this.storage.saveVerificationMethod(sender, verificationMethod);
  }
}
