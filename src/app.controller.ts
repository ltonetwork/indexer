import { Get, Controller, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor() { }

  @Get()
  @ApiExcludeEndpoint()
  async root(@Res() res: Response): Promise<void> {
    return res.redirect('api-docs/');
  }
}
