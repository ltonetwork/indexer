import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { DIDDocument, DIDResolution, DIDDocumentService } from './interfaces/did.interface';
import { KeyType } from './verification-method/verification-method.types';
import { base58 } from '@scure/base';
import * as ed2curve from 'ed2curve';
import { isValidAddress, networkId } from '../utils/crypto';
import { isInvalidDate, isoDate } from '../utils/date';

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

    if (!created || isInvalidDate(versionTime)) {
      return {
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: {},
        didDocumentMetadata: {},
        didResolutionMetadata: {
          contentType: 'application/did+ld+json',
          error: isInvalidDate(versionTime) ? 'invalidDidUrl' : !isValidAddress(address) ? 'invalidDid' : 'notFound',
        },
      };
    }

    const didResolutionMetadata: DIDResolution['didResolutionMetadata'] = {
      contentType: 'application/did+ld+json',
      did: {
        didString: `did:lto:${address}`,
        method: 'lto',
        methodSpecificId: address,
      },
      networkId: networkId(address),
    };

    if (created > versionTime.getTime()) {
      return {
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: {
          '@context': 'https://www.w3.org/ns/did/v1',
          id: `did:lto:${address}`,
          verificationMethod: [],
        },
        didDocumentMetadata: {
          created: isoDate(created),
          deactivated: false,
          nextUpdate: isoDate(created),
        },
        didResolutionMetadata,
      };
    }

    const deactivated = await this.storage.isDIDDeactivated(address);
    if (deactivated && deactivated.timestamp <= versionTime.getTime()) {
      return {
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument: {
          '@context': 'https://www.w3.org/ns/did/v1',
          id: `did:lto:${address}`,
          verificationMethod: [],
        },
        didDocumentMetadata: {
          created: isoDate(created),
          updated: isoDate(deactivated.timestamp),
          deactivated: true,
          deactivatedBy: `did:lto:${deactivated.sender}`,
        },
        didResolutionMetadata,
      };
    }

    const { updated, nextUpdate, lastUpdate } = await this.getUpdateTimestamps(address, versionTime);

    const didDocument = await this.asDidDocument(`did:lto:${address}`, address, versionTime);

    return {
      '@context': 'https://w3id.org/did-resolution/v1',
      didDocument,
      didDocumentMetadata: {
        created: isoDate(created),
        updated: updated ? isoDate(updated) : undefined,
        deactivated: false,
        nextUpdate: nextUpdate ? isoDate(nextUpdate) : undefined,
        lastUpdate: lastUpdate ? isoDate(lastUpdate) : undefined,
      },
      didResolutionMetadata,
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
      ...(await this.storage.isDIDDeactivated(address).then((d) => (d ? [d.timestamp] : []))),
    ].sort((a, b) => b - a);

    const updated = timestamps.find((timestamp) => timestamp <= versionTime.getTime());
    const nextUpdate = timestamps.filter((timestamp) => timestamp > versionTime.getTime()).pop();
    const lastUpdate = timestamps[0];

    return { updated, nextUpdate, lastUpdate };
  }

  private async asDidDocument(id: string, address: string, versionTime: Date): Promise<DIDDocument> {
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/secp256k1-2019/v1 ',
      ],
      id,
      ...(await this.getVerificationMethods(address, versionTime)),
      service: await this.getServices(address, versionTime),
    };
  }

  private async getVerificationMethods(address: string, versionTime: Date): Promise<DIDDocumentVerificationMethods> {
    const methods = await this.verificationMethodService.getMethodsFor(address, versionTime);
    const didDocument: DIDDocumentVerificationMethods = {
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
    };

    for (const method of methods) {
      const { publicKey: recipientPublicKey, keyType: recipientKeyType } = await this.storage.getPublicKey(
        method.recipient,
      );

      if (!recipientPublicKey) {
        this.logger.warn(`Skipping verification method ${method.recipient} of did:lto:${address}. Public key unknown`);
        continue;
      }

      const didVerificationMethod = method.asDidMethod(recipientPublicKey, KeyType[recipientKeyType]);

      if (method.isOnlyDeactivateCapability()) {
        didDocument.capabilityInvocation.push(didVerificationMethod);
        continue;
      }

      didDocument.verificationMethod.push(didVerificationMethod);

      if (method.isAuthentication()) didDocument.authentication.push(didVerificationMethod.id);
      if (method.isAssertionMethod()) didDocument.assertionMethod.push(didVerificationMethod.id);

      if (method.isKeyAgreement()) {
        if (recipientKeyType === 'ed25519') {
          const publicKey = base58.encode(ed2curve.convertPublicKey(base58.decode(recipientPublicKey)));
          didDocument.keyAgreement.push(method.asDidMethod(publicKey, KeyType.x25519));
        } else {
          didDocument.keyAgreement.push(didVerificationMethod.id);
        }
      }

      if (method.isCapabilityInvocation()) didDocument.capabilityInvocation.push(didVerificationMethod.id);
      if (method.isCapabilityDelegation()) didDocument.capabilityDelegation.push(didVerificationMethod.id);
    }

    return didDocument;
  }

  private async getServices(address: string, versionTime: Date): Promise<DIDDocumentService[]> {
    const versionTimestamp = versionTime?.getTime() ?? Date.now();

    const services = (await this.storage.getDIDServices(address)).sort((a, b) => a.timestamp - b.timestamp);

    const map = new Map<string, DIDDocumentService>();

    for (const serviceWithTimestamp of services) {
      const { timestamp, ...service } = serviceWithTimestamp;
      if (timestamp <= versionTimestamp) {
        const id = service.id.replace(new RegExp(`^did:lto:${address}#`), '#');
        map.set(id, service);
      }
    }

    return Array.from(map.values()).filter((service) => !!service.type);
  }
}
