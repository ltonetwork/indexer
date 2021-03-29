import { Controller, Post, Req, Res, Get } from '@nestjs/common';
import { ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { deriveAddress, chainIdOf, base58decode } from '@lto-network/lto-crypto';
import { LoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.service';

@Controller('identities')
@ApiUseTags('identity')
export class IdentityController {
  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) { }

  @Get(':address')
  @ApiOperation({ title: 'Get a DID document' })
  @ApiImplicitParam({ name: 'address', description: 'DID url or network address' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'invalid did url given' })
  @ApiResponse({ status: 404, description: 'address not indexed' })
  @ApiResponse({ status: 500, description: `failed to get DID document '[reason]'` })
  async getIdentity(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const url = req.params.address;
    if (!url) {
      return res.status(400).json({error: 'invalid-did-url'});
    }

    const address = url.replace(/^did:lto:/, '');

    try {
      const publicKey = await this.storage.getPublicKey(address);

      if (!publicKey) {
        return res.status(404).json({error: 'not-found'});
      }

      const identity = this.asDidDocument(address, publicKey);

      res.status(200).json(identity);
    } catch (e) {
      this.logger.error(`identity-controller: failed to get DID document '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get DID document '${e}'`);
    }
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

  @Get(':address/derived/:secret')
  @ApiOperation({ title: 'Get a DID document for a derived identity' })
  @ApiImplicitParam({ name: 'address', description: 'DID url or network address' })
  @ApiImplicitParam({ name: 'secret', description: 'Base58 encoded unique (random) value' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'invalid did url given' })
  @ApiResponse({ status: 400, description: 'invalid secret given' })
  @ApiResponse({ status: 404, description: 'address not indexed' })
  @ApiResponse({ status: 500, description: `failed to get DID document '[reason]'` })
  async getDerivedIdentity(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const url = req.params.address;
    if (!url) {
      return res.status(400).json({error: 'invalid-did-url'});
    }
    const address = url.replace(/^did:lto:/, '');

    const secret = req.params.secret;
    try {
      base58decode(secret);
    } catch (err) {
      return res.status(400).json({error: 'invalid-secret'});
    }

    try {
      const publicKey = await this.storage.getPublicKey(address);
      if (!publicKey) {
        return res.status(404).json({error: 'not-found'});
      }

      const derivedAddress = deriveAddress({public: publicKey}, secret, chainIdOf(address));
      const identity = this.asDerivedDidDocument(address, secret, derivedAddress, publicKey);

      res.status(200).json(identity);
    } catch (e) {
      this.logger.error(`identity-controller: failed to get DID document '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get DID document '${e}'`);
    }
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
