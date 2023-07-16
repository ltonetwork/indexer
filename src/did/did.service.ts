import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';
import { chainIdOf } from '@lto-network/lto-crypto';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { DIDDocument, DIDResolution, DIDDocumentService } from './interfaces/did.interface';
import { KeyType } from './verification-method/model/verification-method.types';
import ed2curve from '@lto-network/lto-crypto/dist/libs/ed2curve';
import { base58 } from '@scure/base';

type DIDDocumentVerificationMethods = Pick<
  DIDDocument,
  | 'verificationMethod'
  | 'authentication'
  | 'assertionMethod'
  | 'keyAgreement'
  | 'capabilityInvocation'
  | 'capabilityDelegation'
>;

@Injectable()
export class DIDService {
  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
    readonly verificationMethodService: VerificationMethodService,
  ) {}

  async resolve(did: string, versionTime?: Date): Promise<DIDResolution> {
    versionTime ??= new Date();
    const address = did.replace(/^did:lto:/, '');

    const created = await this.storage.getAccountCreated(address);

    if (!created || created > versionTime.getTime()) {
      return {
        '@context': 'https://www.w3.org/ns/did/v1',
        didDocument: {},
        didDocumentMetadata: {},
        didResolutionMetadata: {
          error: 'notFound', // TODO: notFound or invalidDid
        },
      };
    }

    const deactivated = await this.storage.isDIDDeactivated(address);
    if (deactivated && deactivated.timestamp <= versionTime.getTime()) {
      return {
        '@context': 'https://www.w3.org/ns/did/v1',
        didDocument: {
          '@context': 'https://www.w3.org/ns/did/v1',
          id: `did:lto:${address}`,
          verificationMethod: [],
        },
        didDocumentMetadata: {
          created: new Date(created).toISOString(),
          updated: new Date(deactivated.timestamp).toISOString(),
          deactivated: true,
          deactivatedBy: `did:lto:${deactivated.sender}`,
        },
        didResolutionMetadata: {
          method: 'lto',
          networkId: chainIdOf(address),
        },
      };
    }

    const didDocument = await this.asDidDocument(`did:lto:${address}`, address, versionTime);
    const { updated, nextUpdate, lastUpdate } = await this.getUpdateTimestamps(address, versionTime);

    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      didDocument,
      didDocumentMetadata: {
        created: new Date(created).toISOString(),
        updated: updated ? new Date(updated).toISOString() : undefined,
        nextUpdate: nextUpdate ? new Date(nextUpdate).toISOString() : undefined,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : undefined,
        deactivated: false,
      },
      didResolutionMetadata: {
        method: 'lto',
        networkId: chainIdOf(address),
      },
    };
  }

  async resolveDocument(did: string, versionTime?: Date): Promise<DIDDocument | null> {
    versionTime ??= new Date();
    const address = did.replace(/^did:lto:/, '');

    const created = await this.storage.getAccountCreated(address);
    if (!created || created > versionTime.getTime()) return null;

    const deactivated = await this.storage.isDIDDeactivated(address);
    if (deactivated && deactivated.timestamp <= versionTime.getTime()) return null;

    return this.asDidDocument(`did:lto:${address}`, address, versionTime);
  }

  private async getUpdateTimestamps(
    address: string,
    versionTime: Date,
  ): Promise<{
    updated?: number;
    nextUpdate?: number;
    lastUpdate?: number;
  }> {
    const timestamps = [
      ...(await this.storage.getVerificationMethods(address)).map((method) => method.timestamp),
      ...(await this.storage.getDIDServices(address)).map((service) => service.timestamp),
    ].sort((a, b) => b - a);

    const updated = timestamps.find((timestamp) => timestamp <= versionTime.getTime());
    const nextUpdate = timestamps.filter((timestamp) => timestamp > versionTime.getTime()).pop();
    const lastUpdate = timestamps[0];

    return { updated, nextUpdate, lastUpdate };
  }

  private async asDidDocument(id: string, address: string, versionTime: Date): Promise<DIDDocument> {
    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      id,
      ...(await this.getVerificationMethods(address, versionTime)),
      service: await this.getServices(address, versionTime),
    };
  }

  private async getVerificationMethods(address: string, versionTime: Date): Promise<DIDDocumentVerificationMethods> {
    const methods = await this.verificationMethodService.getMethodsFor(address, versionTime);
    const didDocument: DIDDocumentVerificationMethods = { verificationMethod: [] };

    for (const method of methods) {
      const { publicKey: recipientPublicKey, keyType: recipientKeyType } = await this.storage.getPublicKey(
        method.recipient,
      );

      if (!recipientPublicKey) {
        this.logger.warn(`Skipping verification method ${method.recipient} of did:lto:${address}. Public key unknown`);
        continue;
      }

      const didVerificationMethod = method.asDidMethod(recipientPublicKey, KeyType[recipientKeyType]);

      didDocument.verificationMethod.push(didVerificationMethod);

      if (method.isAuthentication()) {
        didDocument.authentication ??= [];
        didDocument.authentication.push(didVerificationMethod.id);
      }

      if (method.isAssertionMethod()) {
        didDocument.assertionMethod ??= [];
        didDocument.assertionMethod.push(didVerificationMethod.id);
      }

      if (method.isKeyAgreement()) {
        didDocument.keyAgreement ??= [];
        if (recipientKeyType === 'ed25519') {
          const publicKey = base58.encode(ed2curve.convertPublicKey(base58.decode(recipientPublicKey)));
          didDocument.keyAgreement.push(method.asDidMethod(publicKey, KeyType.x25519));
        } else {
          didDocument.keyAgreement.push(didVerificationMethod.id);
        }
      }

      if (method.isCapabilityInvocation()) {
        didDocument.capabilityInvocation ??= [];
        didDocument.capabilityInvocation.push(didVerificationMethod.id);
      }

      if (method.isCapabilityDelegation()) {
        didDocument.capabilityDelegation ??= [];
        didDocument.capabilityDelegation.push(didVerificationMethod.id);
      }
    }

    return didDocument;
  }

  private async getServices(address: string, versionTime: Date): Promise<DIDDocumentService[]> {
    const versionTimestamp = versionTime?.getTime() ?? Date.now();

    const services = (await this.storage.getDIDServices(address)).sort((a, b) => a.timestamp - b.timestamp);

    const map = new Map<string, DIDDocumentService>();

    for (const serviceWithTimestamp of services) {
      const { timestamp, ...service } = serviceWithTimestamp;
      if (timestamp <= versionTimestamp) map.set(service.id, service);
    }

    return Array.from(map.values()).filter((service) => !!service.type);
  }
}
