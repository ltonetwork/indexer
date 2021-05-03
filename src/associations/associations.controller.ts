import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { BearerAuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AssociationApiModel } from './api/association.model';
import { AssociationsService } from './associations.service';

@Controller('associations')
export class AssociationsController {

  constructor(
    readonly service: AssociationsService,
  ) {
  }

  @Get('/:address')
  @ApiParam({ name: 'address' })
  @ApiOperation({ title: 'Add association to the blockchain' })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: ['invalid body given'].join('<br>'),
  })
  @ApiResponse({ status: 500, description: `failed to anchor '[reason]'` })
  async get(@Req() req: Request, @Res() res: Response): Promise<Response> {

    const address = req.params.address;

    if (!address) {
      throw new BadRequestException('No address given');
    }

    return res.json(await this.service.getAssociations(address.trim()));
  }
}
