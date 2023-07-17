import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import { StorageService } from '../../storage/storage.service';
import { VerificationMethod } from './model/verification-method.model';
import { RelationshipType } from './model/verification-method.types';

@Injectable()
export class VerificationMethodService {
  constructor(private readonly logger: LoggerService, private readonly storage: StorageService) {}

  async getMethodsFor(address: string, versionTime?: Date | number): Promise<VerificationMethod[]> {
    const versionTimestamp = typeof versionTime === 'number' ? versionTime : versionTime?.getTime() ?? Date.now();

    const defaultMethod = new VerificationMethod(0x11f, address, 0);
    const map = this.currentMethods(
      [defaultMethod, ...(await this.storage.getVerificationMethods(address))],
      versionTimestamp,
    );

    const deactivateMethods = this.currentMethods(await this.storage.getDeactivateMethods(address), versionTimestamp);
    this.mergeMethods(map, deactivateMethods.values(), versionTimestamp);

    if (!map.has(address) || !map.get(address).isActive(versionTimestamp)) map.set(address, defaultMethod);

    return Array.from(map.values()).filter((method) => method.isActive(versionTimestamp));
  }

  private currentMethods(methods: VerificationMethod[], versionTimestamp: number): Map<string, VerificationMethod> {
    methods = methods.sort((a, b) => a.timestamp - b.timestamp);
    const map = new Map<string, VerificationMethod>();

    for (const method of methods) {
      if (method.timestamp <= versionTimestamp) map.set(method.recipient, method);
    }

    return map;
  }

  private mergeMethods(
    map: Map<string, VerificationMethod>,
    methods: Iterable<VerificationMethod>,
    versionTimestamp: number,
  ): void {
    for (const method of methods) {
      if (!method.isActive(versionTimestamp)) continue;
      const currentMethod = map.get(method.recipient);

      if (currentMethod && currentMethod.isActive(versionTimestamp)) {
        currentMethod.relationships = currentMethod.relationships | method.relationships;
        currentMethod.timestamp = Math.max(currentMethod.timestamp, method.timestamp);
      } else {
        method.relationships = method.relationships | 0x1000; // Mark as only deactivate capability
        map.set(method.recipient, method);
      }
    }
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
    if (type === 0x108 && sender === recipient) return;

    const relationships = type | this.getTypeForRelationship(data);
    const verificationMethod = new VerificationMethod(relationships, recipient, timestamp, expires);

    this.logger.debug(`DID: 'did:lto:${sender}' add verification method '${recipient}'`);

    if (type === 0x108) {
      await this.storage.saveDeactivateMethod(sender, verificationMethod);
    } else {
      await this.storage.saveVerificationMethod(sender, verificationMethod);
    }
  }

  async revoke(type: number, sender: string, recipient: string, timestamp: number): Promise<void> {
    if (type === 0x108 && sender === recipient) return;

    const relationships = sender === recipient ? 0x11f : 0;
    const verificationMethod = new VerificationMethod(relationships, recipient, timestamp);

    this.logger.debug(`DID: 'did:lto${sender}' revoke verification method '${recipient}'`);

    if (type === 0x108) {
      await this.storage.saveDeactivateMethod(sender, verificationMethod);
    } else {
      await this.storage.saveVerificationMethod(sender, verificationMethod);
    }
  }

  async hasDeactivateCapability(address: string, sender: string): Promise<boolean> {
    if (sender === address) return true;

    const methods = (await this.storage.getDeactivateMethods(address))
      .filter((method) => method.recipient === sender)
      .sort((a, b) => b.timestamp - a.timestamp);

    return methods.length > 0 && methods[0].isActive();
  }
}
