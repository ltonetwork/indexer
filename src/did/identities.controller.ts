import { Controller, Res, Get, Param } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';

@ApiExcludeController()
@Controller('identities')
export class IdentitiesController {
  @Get(':did')
  async redirect(@Param('did') did: string, @Res() res: Response): Promise<void> {
    res.redirect(301, `/identifiers/${did}`);
  }
}
