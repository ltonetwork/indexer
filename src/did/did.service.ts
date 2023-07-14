import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';
import {chainIdOf } from '@lto-network/lto-crypto';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { DIDDocument, DIDResolution, DIDService } from './interfaces/identity.interface';
import {KeyType} from './verification-method/model/verification-method.types';

@Injectable()
export class DidService {
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
    if (!created || created > versionTime.getTime()) return {
      '@context': 'https://www.w3.org/ns/did/v1',
      'didDocument': {},
      'didDocumentMetadata': {},
      'didResolutionMetadata': {
        error: 'notFound', // TODO: notFound or invalidDid
      },
    };

    // TODO: deactivated
    // TODO: next update

    const didDocument = await this.asDidDocument(`did:lto:${address}`, address, versionTime);

    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      didDocument,
      'didDocumentMetadata': {
        created: created ? new Date(created) : null,
        updated: false,
        deactivated: false,
      },
      'didResolutionMetadata': {
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

    // TODO: deactivated

    return this.asDidDocument(`did:lto:${address}`, address, versionTime);
  }

  private async asDidDocument(id: string, address: string, versionTime: Date): Promise<DIDDocument> {
    const didDocument: DIDDocument = { '@context': 'https://www.w3.org/ns/did/v1', id, 'verificationMethod': [] };
    const verificationMethods = await this.verificationMethodService.getMethodsFor(address, versionTime);

    for (const verificationMethod of verificationMethods) {
      const {publicKey: recipientPublicKey, keyType: recipientKeyType} =
          await this.storage.getPublicKey(verificationMethod.recipient);

      if (!recipientPublicKey) {
        this.logger.warn(
          `Skipping verification method of ${verificationMethod.recipient} for did:lto:${address}. Public key unknown`,
        );
        continue;
      }

      const didVerificationMethod = verificationMethod.asDidMethod(recipientPublicKey, KeyType[recipientKeyType]);

      didDocument.verificationMethod.push(didVerificationMethod);

      if (verificationMethod.isAuthentication()) {
        didDocument.authentication ??= [];
        didDocument.authentication.push(didVerificationMethod.id);
      }

      if (verificationMethod.isAssertionMethod()) {
        didDocument.assertionMethod ??= [];
        didDocument.assertionMethod.push(didVerificationMethod.id);
      }

      if (verificationMethod.isKeyAgreement()) {
        didDocument.keyAgreement ??= [];
        didDocument.keyAgreement.push(
          recipientKeyType === 'ed25519'
            ? verificationMethod.asDidMethod(recipientPublicKey, KeyType.x25519)
            : didVerificationMethod.id,
        );
      }

      if (verificationMethod.isCapabilityInvocation()) {
        didDocument.capabilityInvocation ??= [];
        didDocument.capabilityInvocation.push(didVerificationMethod.id);
      }

      if (verificationMethod.isCapabilityDelegation()) {
        didDocument.capabilityDelegation ??= [];
        didDocument.capabilityDelegation.push(didVerificationMethod.id);
      }
    }

    didDocument.service = await this.getServices(address, versionTime);

    return didDocument;
  }

  private async getServices(address: string, versionTime: Date): Promise<DIDService[]> {
    const versionTimestamp = versionTime?.getTime() ?? Date.now();

    const services = (await this.storage.getServices(address))
      .sort((a, b) => b.timestamp - a.timestamp);

    const map = new Map<string, DIDService>();

    for (const serviceWithTimestamp of services) {
      const { timestamp, ...service } = serviceWithTimestamp;
      if (timestamp <= versionTimestamp) map.set(service.id, service);
    }

    return Array.from(map.values()).filter((service) => !!service.type);
  }
}
