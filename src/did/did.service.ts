import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import {chainIdOf, buildAddress, base58decode } from '@lto-network/lto-crypto';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { DIDDocument, DIDResolution } from './interfaces/identity.interface';
import { IndexDocumentType } from '../index/model/index.model';
import {KeyType} from './verification-method/model/verification-method.types';
import { Transaction } from '../transaction/interfaces/transaction.interface';

@Injectable()
export class DidService {
  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
    readonly verificationMethodService: VerificationMethodService,
  ) {}

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { sender, senderPublicKey, senderKeyType, associationType, timestamp } = transaction;

    this.logger.debug(`identity: saving ${senderKeyType} public key ${senderPublicKey} for address ${sender}`);
    await this.storage.savePublicKey(sender, senderPublicKey, senderKeyType, timestamp);

    if (transaction.type === 20) {
      await this.indexRegister(transaction);
    } else if (transaction.type === 16 && associationType >= 0x0100 && associationType <= 0x0120) {
      await this.indexIssue(transaction);
    } else if (transaction.type === 17 && associationType >= 0x0100 && associationType <= 0x0120) {
      await this.indexRevoke(transaction);
    }
  }

  private async indexRegister(tx: Transaction): Promise<void> {
    await Promise.all(tx.accounts.map( account => {
      const address = buildAddress(base58decode(account.publicKey), chainIdOf(tx.sender));
      this.logger.debug(
        `identity: register ${account.keyType} public key ${account.publicKey} for address ${address}`,
      );
      return this.storage.savePublicKey(address, account.publicKey, account.keyType, tx.timestamp);
    }));
  }

  private async indexIssue(tx: Transaction): Promise<void> {
    const data = Object.fromEntries(tx.data.map(({ key, value }) => [key, !!value]));
    await this.verificationMethodService.save(tx.associationType, tx.sender, tx.recipient, data, tx.timestamp);
  }

  private async indexRevoke(tx: Transaction): Promise<void> {
    await this.verificationMethodService.revoke(tx.sender, tx.recipient, tx.timestamp);
  }

  async resolve(did: string, versionTime?: Date): Promise<DIDResolution> {
    versionTime ??= new Date();
    const address = did.replace(/^did:lto:/, '');

    const created = await this.storage.getAccountCreated(address);
    if (!created || created > versionTime.getTime()) return {
      '@context': 'https://www.w3.org/ns/did/v1',
      'didDocument': {},
      'didDocumentMetadata': {},
      'didResolutionMetadata': {
        didUrl: this.config.getNodeUrl() + '/identifiers/' + did,
        error: 'notFound', // TODO: notFound or invalidDid
      },
    };

    // TODO: deactivated
    // TODO: next update

    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      'didDocument': this.asDidDocument(`did:lto:${address}`, address, versionTime),
      'didDocumentMetadata': {
        created: created ? new Date(created) : null,
        updated: false,
        deactivated: false,
      },
      'didResolutionMetadata': {
        didUrl: this.config.getNodeUrl() + '/identifiers/' + did,
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
    const verificationMethods = await this.verificationMethodService.getMethodsFor(address, versionTime.getTime());

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

    return didDocument;
  }
}
