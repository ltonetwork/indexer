import { Get, Controller, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from './common/config/config.service';

@Controller()
export class AppController {
  constructor(private config: ConfigService) {}

  @Get()
  @ApiExcludeEndpoint()
  async root(@Res() res: Response): Promise<void> {
    return res.redirect(this.config.getApiDocsUrl());
  }
}
