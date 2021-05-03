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

  async getIdentity(address: string): Promise<object|null> {
    const publicKey = await this.storage.getPublicKey(address);

    if (!publicKey) {
      return null;
    }

    return this.asDidDocument(address, publicKey);
  }

  asDidDocument(address: string, publicKey: string): object {
    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      'id': `did:lto:${address}`,
      'verificationMethod': [{
        id: `did:lto:${address}#key`,
        type: 'Ed25519VerificationKey2018',
        controller: `did:lto:${address}`,
        publicKeyBase58: publicKey,
      }],
      'authentication': [
        `did:lto:${address}#key`,
      ],
      'assertionMethod': [
        `did:lto:${address}#key`,
      ],
    };
  }

  async getDerivedIdentity(address: string, secret: string): Promise<object> {
    const publicKey = await this.storage.getPublicKey(address);

    if (!publicKey) {
      return null;
    }

    const derivedAddress = deriveAddress({public: publicKey}, secret, chainIdOf(address));

    return this.asDerivedDidDocument(address, secret, derivedAddress, publicKey);
  }

  asDerivedDidDocument(controllerAddress: string, secret: string, derivedAddress: string, publicKey: string): object {
    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      'id': `did:lto:${controllerAddress}/derived/${secret}`,
      'alsoKnownAs': [
        `did:lto:${derivedAddress}`,
      ],
      'verificationMethod': [{
        id: `did:lto:${controllerAddress}#key`,
        type: 'Ed25519VerificationKey2018',
        controller: `did:lto:${controllerAddress}`,
        publicKeyBase58: publicKey,
      }],
      'authentication': [
        `did:lto:${controllerAddress}#key`,
      ],
      'assertionMethod': [
        `did:lto:${controllerAddress}#key`,
      ],
    };
  }
}
