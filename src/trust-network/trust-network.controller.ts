import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';

import { LoggerService } from '../logger/logger.service';
import { TrustNetworkService } from './trust-network.service';

@Controller('trust-network')
@ApiTags('trust-network')
export class TrustNetworkController {
  constructor(
    private readonly logger: LoggerService,
    private readonly service: TrustNetworkService,
  ) { }

  // @todo: make `getRoles` work properly
  @Get(':address')
  @ApiOperation({ summary: 'Retrieves the roles for an identity' })
  @ApiParam({ name: 'address', description: 'Network address' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'invalid address' })
  async getRoles(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const address = req.params.address;
    if (!address) {
      return res.status(400).json({ error: 'invalid address' });
    }

    return res.status(200).json({ message: 'Temporary' });
  }
}
