import { Controller, Post, Req, Res, Get } from '@nestjs/common';
import { ApiImplicitParam, ApiOperation, ApiResponse, ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.service';

@Controller('did')
@ApiUseTags('did')
export class DidController {
  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) { }

  @Get(':url')
  @ApiOperation({ title: 'Get a DID document' })
  @ApiImplicitParam({ name: 'url', description: 'DID url or address' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'invalid did url given' })
  @ApiResponse({ status: 404, description: 'address not indexed' })
  @ApiResponse({ status: 500, description: `failed to get DID document '[reason]'` })
  async getDidDocument(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const url = req.params.url;
    if (!url) {
      return res.status(400).json({error: 'invalid-did-url'});
    }

    const address = url.replace(/^did:lto:/, '');

    try {
      const publicKey = await this.storage.getPublicKey(address);

      if (!publicKey) {
        return res.status(404).json({error: 'no-found'});
      }

      const did = this.asDidDocument(address, publicKey);

      res.status(200).json(did);
    } catch (e) {
      this.logger.error(`did-controller: failed to get transaction by did '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get transaction by did '${e}'`);
    }
  }

  asDidDocument(address: string, publicKey: string): object {
    return {
      '@context': 'https://www.w3.org/ns/did/v1',
      'id': `did:lto:${address}`,
      'authentication': [{
        id: `did:example:${address}#key`,
        type: 'Ed25519VerificationKey2018',
        controller: `did:example:${address}`,
        publicKeyBase58: publicKey,
      }],
    };
  }
}
