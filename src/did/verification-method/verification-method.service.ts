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

  async getMethodsFor(address: string, timestamp?: number): Promise<VerificationMethod[]> {
    timestamp ??= Date.now();

    const methods = (await this.storage.getVerificationMethods(address))
      .sort((a, b) => b.timestamp - a.timestamp);
    const map = new Map<string, VerificationMethod>();

    methods.unshift(new VerificationMethod(0x11f, address, address, timestamp));

    for (const method of methods) {
      if (method.timestamp <= timestamp) map.set(method.recipient, method);
    }

    return Array.from(map.values()).filter((method) => method.isActive(timestamp));
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
    const verificationMethod = new VerificationMethod(
      type | this.getTypeForRelationship(data),
      sender,
      recipient,
      Math.floor(timestamp / 1000),
      expires ? Math.floor(expires / 1000) : undefined,
    );

    this.logger.debug(`identity: 'did:lto${sender}' add verification method 'did:lto:${recipient}'`);
    await this.storage.saveVerificationMethod(sender, verificationMethod);
  }

  async revoke(sender: string, recipient: string, timestamp: number): Promise<void> {
    const verificationMethod = new VerificationMethod(0, sender, recipient, timestamp);

    this.logger.debug(`identity: 'did:lto${sender}' revoke verification method 'did:lto:${recipient}'`);
    await this.storage.saveVerificationMethod(sender, verificationMethod);
  }
}
