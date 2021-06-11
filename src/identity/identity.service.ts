import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { chainIdOf, deriveAddress, convertED2KeyToX2 } from '@lto-network/lto-crypto';
import { VerificationMethodService } from '../verification-method/verification-method.service';
import { DIDDocument } from './interfaces/identity.interface';

@Injectable()
export class IdentityService {

  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
    readonly verificationMethodService: VerificationMethodService
  ) {
  }

  async resolve(did: string): Promise<DIDDocument> {
    const {address} = did.match(/^(?:did:lto:)?(?<address>\w+)(?::derived:(?<secret>\w+))?$/).groups;

    const publicKey = await this.storage.getPublicKey(address);
    const id = did.replace(/^(?:did:lto:)?/, '');

    return this.asDidDocument(id, address, publicKey);;
  }

  async getAddress(did: string): Promise<string> {
    const {address, secret} = did.match(/(?:did:lto:)?(?<addr>\w+)(?::derived:(?<secret>\w+))?/).groups;

    if (!secret) {
      return address;
    }

    const publicKey = await this.storage.getPublicKey(address);

    return deriveAddress({ public: publicKey }, secret, chainIdOf(address));
  }

  async getDerivedIdentity(address: string, secret: string): Promise<DIDDocument> {
    const publicKey = await this.storage.getPublicKey(address);

    if (!publicKey) {
      return null;
    }

    return this.asDidDocument(`${address}:derived:${secret}`, address, publicKey);
  }

  async asDidDocument(id: string, address: string, publicKey: string): Promise<DIDDocument> {
    const verificationMethods = await this.verificationMethodService.getMethodsFor(address);
    const didDocument: DIDDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: `did:lto:${id}`,
      verificationMethod: [{
        id: `did:lto:${address}#key`,
        type: 'Ed25519VerificationKey2018',
        controller: `did:lto:${address}`,
        publicKeyBase58: publicKey,
        blockchainAccountId: `${address}@lto:${chainIdOf(address)}`,
      }],
    };

    for (const verificationMethod of verificationMethods) {
      const recipientPublicKey = await this.storage.getPublicKey(verificationMethod.recipient);

      if (!recipientPublicKey) return null;

      const didVerificationMethod = verificationMethod.asDidMethod(recipientPublicKey);
      didDocument.verificationMethod.push(didVerificationMethod);

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

      if (verificationMethod.isKeyAgreement()) {
        const keyAgreement = {
          id: `${didVerificationMethod.controller}#sign`,
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

    if (didDocument.verificationMethod.length == 1) {
      didDocument.authentication = [ `did:lto:${address}#key` ];
      didDocument.assertionMethod = [ `did:lto:${address}#key` ];
      didDocument.capabilityInvocation = [ `did:lto:${address}#key` ];
    }

    return didDocument;
  }
}
