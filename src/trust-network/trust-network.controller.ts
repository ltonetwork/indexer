import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';

import { TrustNetworkService } from './trust-network.service';

@Controller('trust')
@ApiTags('trust-network')
export class TrustNetworkController {
  constructor(
    private readonly service: TrustNetworkService,
  ) { }

  @Get(':address')
  @ApiOperation({ summary: 'Retrieves the roles for an identity' })
  @ApiParam({ name: 'address', description: 'Network address' })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: ['invalid address', 'failed to resolve roles'].join('<br>'),
  })
  async getRoles(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const address = req.params.address;
    
    if (!address) {
      return res.status(400).json({ error: 'invalid address' });
    }

    try {
      const roles = await this.service.getRolesFor(address);
  
      return res.status(200).json(roles);
    } catch (error) {
      return res.status(400).json({ error: 'failed to resolve roles' });
    }
  }
}
