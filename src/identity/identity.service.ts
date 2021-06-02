import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { StorageService } from '../storage/storage.service';
import { chainIdOf, deriveAddress } from '@lto-network/lto-crypto';

@Injectable()
export class IdentityService {

  constructor(
    readonly logger: LoggerService,
    readonly config: ConfigService,
    readonly storage: StorageService,
  ) {
  }

  async resolve(did: string): Promise<object> {
    const {address} = did.match(/^(?:did:lto:)?(?<address>\w+)(?::derived:(?<secret>\w+))?$/).groups;

    const publicKey = await this.storage.getPublicKey(address);
    const id = did.replace(/^(?:did:lto:)?/, '');

    return this.asDidDocument(id, address, publicKey);
  }

  async getAddress(did: string): Promise<string> {
    const {address, secret} = did.match(/(?:did:lto:)?(?<addr>\w+)(?::derived:(?<secret>\w+))?/).groups;

    if (!secret) {
      return address;
    }

    const publicKey = await this.storage.getPublicKey(address);

    return deriveAddress({ public: publicKey }, secret, chainIdOf(address));
  }

  async getDerivedIdentity(address: string, secret: string): Promise<object> {
    const publicKey = await this.storage.getPublicKey(address);

    if (!publicKey) {
      return null;
    }

    return this.asDidDocument(`${address}:derived:${secret}`, address, publicKey);
  }

  asDidDocument(id: string, address: string, publicKey: string): object {
    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      'id': `did:lto:${id}`,
      // @todo extend with verification method service (this is only basic, need to add additional methods)
      'verificationMethod': [{
        id: `did:lto:${address}#key`,
        type: 'Ed25519VerificationKey2018',
        controller: `did:lto:${address}`,
        publicKeyBase58: publicKey,
        blockchainAccountId: `${address}@lto:${chainIdOf(address)}`,
      }],
      'authentication': [
        `did:lto:${address}#key`,
      ],
      'assertionMethod': [
        `did:lto:${address}#key`,
      ],
    };
  }
}
