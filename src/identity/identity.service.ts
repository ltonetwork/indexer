import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import {chainIdOf, deriveAddress, convertED2KeyToX2, buildAddress, base58decode} from '@lto-network/lto-crypto';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { DIDDocument } from './interfaces/identity.interface';
import { IndexDocumentType } from '../index/model/index.model';
import {KeyType} from './verification-method/enums/verification-method.enum';

@Injectable()
export class IdentityService {
  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
    readonly verificationMethodService: VerificationMethodService,
  ) {}

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { id, sender, senderPublicKey, senderKeyType, recipient, associationType } = transaction;

    this.logger.debug(`identity: saving ${senderKeyType} public key ${senderPublicKey} for address ${sender}`);
    await this.storage.savePublicKey(sender, senderPublicKey, senderKeyType);

    if ( transaction.type === 20) {
      await Promise.all(transaction.accounts.map( account => {
        const address = buildAddress(base58decode(account.publicKey), chainIdOf(sender));
        this.logger.debug(`identity: register ${account.keyType} public key ${account.publicKey} for address ${address}`);
        return this.storage.savePublicKey(address, account.publicKey, account.keyType);
      }));
    }

    if (recipient && associationType >= 0x0100 && associationType <= 0x0110) {
      await this.verificationMethodService.save(associationType, sender, recipient);
    }
  }

  async resolve(did: string): Promise<DIDDocument> {
    if (did.match(/^did:ltox:/)) {
      return this.resolveCrossChain(did);
    }

    const { address } = did.match(/^(?:did:lto:)?(?<address>\w+)(?::derived:(?<secret>\w+))?$/).groups;

    const { publicKey, keyType } = await this.storage.getPublicKey(address);
    const id = `did:lto:${address}`;

    if (!publicKey) {
      return null;
    }

    return this.asDidDocument(id, address, publicKey, keyType);
  }

  // TODO: This is wrong. The ltox address must be generated from the public key and indexed.
  async resolveCrossChain(did: string): Promise<DIDDocument> {
    const address = did.replace(/^(?:did:ltox:\w+:\w+:)?/, '');

    const associations = await this.storage.getAssociations(address);

    if (!associations.children || associations.children.length === 0) {
      this.logger.debug(`identity-service: Cross chain address has no association to a known LTO address`);
      return null;
    }

    const alias = associations.children[0];
    const { publicKey, keyType } = await this.storage.getPublicKey(alias);

    const alsoKnownAs = associations.children.map(each => `did:lto:${each}`);

    return this.asDidDocument(did, alias, publicKey, keyType, alsoKnownAs);
  }

  async getAddress(did: string): Promise<string> {
    const { address, secret } = did.match(/(?:did:lto:)?(?<addr>\w+)(?::derived:(?<secret>\w+))?/).groups;

    if (!secret) {
      return address;
    }

    const { publicKey } = await this.storage.getPublicKey(address);

    return deriveAddress({ public: publicKey }, secret, chainIdOf(address));
  }

  async getDerivedIdentity(address: string, secret: string): Promise<DIDDocument> {
    const { publicKey, keyType } = await this.storage.getPublicKey(address);

    if (!publicKey) {
      return null;
    }

    return this.asDidDocument(`${address}:derived:${secret}`, address, publicKey, keyType);
  }

  async asDidDocument(
      id: string,
      address: string,
      publicKey: string,
      keyType: string,
      alsoKnownAs?: string[],
  ): Promise<DIDDocument> {
    const didDocument: DIDDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id,
      'verificationMethod': [
        {
          id: `did:lto:${address}#sign`,
          type: KeyType[keyType],
          controller: `did:lto:${address}`,
          publicKeyBase58: publicKey,
          blockchainAccountId: `${address}@lto:${chainIdOf(address)}`,
        },
      ],
    };

    if (alsoKnownAs && alsoKnownAs.length > 0) {
      didDocument.alsoKnownAs = alsoKnownAs;
    }

    const verificationMethods = await this.verificationMethodService.getMethodsFor(address);
    let hasConfiguredOwn = false;

    for (const verificationMethod of verificationMethods) {
      const {publicKey: recipientPublicKey, keyType: recipientKeyType} =
          await this.storage.getPublicKey(verificationMethod.recipient);

      if (!recipientPublicKey) {
        this.logger.warn(`Skipping verification method of ${verificationMethod.recipient} for did:lto:${address}. Public key unknown`);
        continue;
      }

      const didVerificationMethod = verificationMethod.asDidMethod(recipientPublicKey, KeyType[recipientKeyType]);

      if (verificationMethod.recipient !== verificationMethod.sender) {
        didDocument.verificationMethod.push(didVerificationMethod);
      } else {
        hasConfiguredOwn = true;
      }

      if (verificationMethod.isAuthentication()) {
        didDocument.authentication = didDocument.authentication
          ? [...didDocument.authentication, didVerificationMethod.id]
          : [didVerificationMethod.id];
      }

      if (verificationMethod.isAssertionMethod()) {
        didDocument.assertionMethod = didDocument.assertionMethod
          ? [...didDocument.assertionMethod, didVerificationMethod.id]
          : [didVerificationMethod.id];
      }

      if (verificationMethod.isKeyAgreement() && recipientKeyType === 'ed25519') {
        const keyAgreement = {
          id: `${didVerificationMethod.controller}#encrypt`,
          type: 'X25519KeyAgreementKey2019',
          controller: didVerificationMethod.controller,
          publicKeyBase58: convertED2KeyToX2(recipientPublicKey),
          blockchainAccountId: didVerificationMethod.blockchainAccountId,
        };

        didDocument.keyAgreement = didDocument.keyAgreement
          ? [...didDocument.keyAgreement, keyAgreement]
          : [keyAgreement];
      }

      if (verificationMethod.isCapabilityInvocation()) {
        didDocument.capabilityInvocation = didDocument.capabilityInvocation
          ? [...didDocument.capabilityInvocation, didVerificationMethod.id]
          : [didVerificationMethod.id];
      }

      if (verificationMethod.isCapabilityDelegation()) {
        didDocument.capabilityDelegation = didDocument.capabilityDelegation
          ? [...didDocument.capabilityDelegation, didVerificationMethod.id]
          : [didVerificationMethod.id];
      }
    }

    if (!hasConfiguredOwn) {
      didDocument.authentication = [`did:lto:${address}#sign`, ...(didDocument.authentication || [])];
      didDocument.assertionMethod = [`did:lto:${address}#sign`, ...(didDocument.assertionMethod || [])];
      didDocument.capabilityInvocation = [`did:lto:${address}#sign`, ...(didDocument.capabilityInvocation || [])];
    }

    return didDocument;
  }
}
