import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { HealthService } from './health.service';
import { LoggerService } from '../logger/logger.service';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(
    private readonly logger: LoggerService,
    private readonly health: HealthService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 500, description: 'node is not healthy' })
  async check(@Req() req: Request, @Res() res: Response): Promise<Response> {
    if (!await this.health.isNodeHealthy()) {
      return res.status(500).send('node is not healthy');
    }

    return res.status(200).send();
  }
}
