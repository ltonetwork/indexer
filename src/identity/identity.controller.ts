import { Controller, Post, Req, Res, Get } from '@nestjs/common';
import { ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
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
  @ApiImplicitParam({ name: 'url', description: 'DID url or network address' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'invalid identity url given' })
  @ApiResponse({ status: 404, description: 'address not indexed' })
  @ApiResponse({ status: 500, description: `failed to get DID document '[reason]'` })
  async getDidDocument(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const url = req.params.url;
    if (!url) {
      return res.status(400).json({error: 'invalid-identity-url'});
    }

    const address = url.replace(/^identity:lto:/, '');

    try {
      const publicKey = await this.storage.getPublicKey(address);

      if (!publicKey) {
        return res.status(404).json({error: 'not-found'});
      }

      const identity = this.asDidDocument(address, publicKey);

      res.status(200).json(identity);
    } catch (e) {
      this.logger.error(`identity-controller: failed to get transaction by identity '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get transaction by identity '${e}'`);
    }
  }

  asDidDocument(address: string, publicKey: string): object {
    return {
      '@context': 'https://www.w3.org/ns/identity/v1',
      'id': `identity:lto:${address}`,
      'verificationMethod': [{
        id: `identity:lto:${address}#key`,
        type: 'Ed25519VerificationKey2018',
        controller: `identity:lto:${address}`,
        publicKeyBase58: publicKey,
      }],
      'authentication': [
        `identity:lto:${address}#key`,
      ],
      'assertionMethod': [
        `identity:lto:${address}#key`,
      ],
    };
  }
}
