import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { base58decode } from '@lto-network/lto-crypto';
import { LoggerService } from '../logger/logger.service';
import { IdentityService } from './identity.service';

@Controller('identities')
@ApiTags('identity')
export class IdentityController {
  constructor(
    private readonly logger: LoggerService,
    private readonly service: IdentityService,
  ) { }

  @Get(':address')
  @ApiOperation({ title: 'Get a DID document' })
  @ApiParam({ name: 'address', description: 'DID url or network address' })
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
      const identity = await this.service.getIdentity(address);

      if (!identity) {
        return res.status(404).json({ error: 'not-found' });
      }

      return res.status(200).json(identity);
    } catch (e) {
      this.logger.error(`identity-controller: failed to get DID document '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get DID document '${e}'`);
    }
  }

  @Get(':address/derived/:secret')
  @ApiOperation({ title: 'Get a DID document for a derived identity' })
  @ApiParam({ name: 'address', description: 'DID url or network address' })
  @ApiParam({ name: 'secret', description: 'Base58 encoded unique (random) value' })
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
      const identity = await this.service.getDerivedIdentity(address, secret);

      if (!identity) {
        return res.status(404).json({ error: 'not-found' });
      }

      return res.status(200).json(identity);
    } catch (e) {
      this.logger.error(`identity-controller: failed to get DID document '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get DID document '${e}'`);
    }
  }
}
