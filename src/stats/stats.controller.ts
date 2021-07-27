import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Response, Request } from 'express';

import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';
import { OperationsService } from './operations/operations.service';

@Controller('stats')
@ApiTags('stats')
export class StatsController {
  constructor(
    private readonly service: StatsService,
    private readonly operations: OperationsService,
    private readonly supply: SupplyService,
  ) { }

  @Get('/operations')
  @ApiOperation({ summary: 'Retrieves the operation stats' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'failed to retrieve operation stats' })
  async getOperationStats(@Req() req: Request, @Res() res: Response): Promise<Response> {
    try {
      const operations = await this.operations.getOperationStats();

      return res.status(200).json({ operations });
    } catch (error) {
      return res.status(400).json({ error: 'failed to retrieve operation stats' });
    }
  }

  @Get('/supply/circulating')
  @ApiOperation({ summary: 'Get circulating supply' })
  @ApiQuery({ name: 'output', required: false, description: 'Flag for type of output', enum: ['raw'] })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 500, description: 'failed to get circulating supply' })
  async getCirculatingSupply(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const isRaw = req.query.output === 'raw';

    try {
      const supply = await this.supply.getCirculatingSupply();

      if (isRaw) {
        return res.status(200).contentType('text/plain').send(supply);
      }

      return res.status(200).json({ circulatingSupply: supply });
    } catch (error) {
      return res.status(500).json({ error: `failed to get circulating supply: ${error}` });
    }

  }

  @Get('/supply/max')
  @ApiOperation({ summary: 'Get max supply' })
  @ApiQuery({ name: 'output', required: false, description: 'Flag for type of output', enum: ['raw'] })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 500, description: 'failed to get max supply' })
  async getMaxSupply(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const isRaw = req.query.output === 'raw';

    try {
      const supply = await this.supply.getMaxSupply();

      if (isRaw) {
        return res.status(200).contentType('text/plain').send(supply);
      }

      return res.status(200).json({ maxSupply: supply });
    } catch (error) {
      return res.status(500).json({ error: `failed to get max supply: ${error}` });
    }

  }
}
