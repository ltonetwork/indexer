import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';

import { OperationStatsService } from './operation-stats.service';

@Controller('operation')
@ApiTags('operation-stats')
export class OperationStatsController {
  constructor(
    private readonly service: OperationStatsService,
  ) { }

  @Get('/stats')
  @ApiOperation({ summary: 'Retrieves the operation stats' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'failed to retrieve stats' })
  async getStats(@Req() req: Request, @Res() res: Response): Promise<Response> {
    try {
      const stats = await this.service.getOperationStats();

      return res.status(200).json({ stats });
    } catch (error) {
      return res.status(400).json({ error: 'failed to retrieve stats' });
    }
  }
}
