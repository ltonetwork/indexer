import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { chainIdOf, deriveAddress } from '@lto-network/lto-crypto';
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

    return this.asDidDocument(id, publicKey);;
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

    return this.asDidDocument(`${address}:derived:${secret}`, publicKey);
  }

  async asDidDocument(id: string, publicKey: string): Promise<DIDDocument> {
    const verificationMethods = await this.verificationMethodService.getMethodsFor(id);
    const didDocument: DIDDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: `did:lto:${id}`,
      verificationMethod: [{
        id: `did:lto:${id}#key`,
        type: 'Ed25519VerificationKey2018',
        controller: `did:lto:${id}`,
        publicKeyBase58: publicKey,
        blockchainAccountId: `${id}@lto:${chainIdOf(id)}`,
      }]
    };

    for (const verificationMethod of verificationMethods) {
      const didVerificationMethod = verificationMethod.asDidMethod(publicKey);
      didDocument.verificationMethod.push(didVerificationMethod);
      const didReference = [didVerificationMethod.id];

      if (verificationMethod.isAuthentication()) didDocument.authentication = didReference;
      if (verificationMethod.isAssertionMethod()) didDocument.assertionMethod = didReference;
      if (verificationMethod.isKeyAgreement()) didDocument.keyAgreement = didReference;
      if (verificationMethod.isCapabilityInvocation()) didDocument.capabilityInvocation = didReference;
      if (verificationMethod.isCapabilityDelegation()) didDocument.capabilityDelegation = didReference;
    }

    return didDocument;
  }
}
