import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { HealthService } from './health.service';
import { LoggerService } from '../common/logger/logger.service';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly logger: LoggerService, private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Indexer is in sync' })
  @ApiResponse({
    status: 400,
    description: [
      'Blockchain height is higher than processing height',
      'Node response is invalid',
      'Error with node response',
    ].join('<br>'),
  })
  async check(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const nodeStatus = await this.health.isNodeHealthy();

    if (!nodeStatus.sync) {
      return res.status(400).json(nodeStatus);
    }

    return res.status(200).json(nodeStatus);
  }
}
