import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { IdentityService } from './identity.service';

@Controller('identities')
@ApiTags('identity')
export class IdentityController {
  constructor(
    private readonly logger: LoggerService,
    private readonly service: IdentityService,
  ) { }

  @Get(':did')
  @ApiOperation({ summary: 'Get a DID document' })
  @ApiParam({ name: 'did', description: 'DID or network address' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'invalid DID' })
  @ApiResponse({ status: 404, description: 'DID not found' })
  @ApiResponse({ status: 500, description: `failed to get DID document '[reason]'` })
  async getIdentity(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const did = req.params.did;
    if (!did) {
      return res.status(400).json({error: 'invalidDid'});
    }

    try {
      const identity = await this.service.resolve(did);

      return res.status(200).json(identity);
    } catch (e) {
      if (e.status === 404) {
        return res.status(404).json({ error: 'notFound' });
      } else {
        this.logger.error(`identity-controller: failed to get DID document '${e}'`, { stack: e.stack });
        return res.status(500).json({ error: `failed to get DID document '${e}'` });
      }
    }
  }
}
