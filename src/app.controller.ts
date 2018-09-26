import { Get, Controller, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor() { }

  @Get()
  async root(@Res() res: Response): Promise<void> {
    return res.redirect('/api-docs');
  }
}
