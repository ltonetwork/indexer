import { Get, Controller, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { Response } from "express";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async root(@Res() res: Response): Promise<void> {
    return res.redirect('/api-docs');
  }
}
