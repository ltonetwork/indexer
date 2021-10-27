import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AssociationsService } from './associations.service';

@Controller('associations')
@ApiTags('association')
export class AssociationsController {
  constructor(readonly service: AssociationsService) {}

  @Get('/:address')
  @ApiParam({ name: 'address' })
  @ApiOperation({ summary: 'Get associations from address' })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: 'No address provided',
  })
  @ApiResponse({ status: 500, description: 'Error retrieving associations' })
  async get(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const address = req.params.address;

    if (!address) {
      return res.status(400).json({ error: 'No address provided' });
    }

    try {
      const associations = await this.service.getAssociations(address.trim());
      return res.status(200).json(associations);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error retrieving associations', error });
    }
  }
}
