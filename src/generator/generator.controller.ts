import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeneratorService } from './generator.service';
import { Request, Response } from 'express';

@Controller('generators')
@ApiTags('generator')
export class GeneratorController {
  constructor(
    private readonly service: GeneratorService,
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'Get the current generator statistics' })
  @ApiResponse({ status: 200 })
  getOperationStats(@Req() req: Request, @Res() res: Response): Response {
    return res.status(200).json(this.service.stats);
  }
}
