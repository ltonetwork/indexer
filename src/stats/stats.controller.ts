import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Response, Request } from 'express';

import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';
import { OperationsService } from './operations/operations.service';
import { TransactionService } from '../transaction/transaction.service';

@Controller('stats')
@ApiTags('stats')
export class StatsController {
  constructor(
    private readonly service: StatsService,
    private readonly operations: OperationsService,
    private readonly supply: SupplyService,
    private readonly transactions: TransactionService,
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

  @Get('/transactions/:type/:from/:to')
  @ApiOperation({ summary: 'Get transaction count per day' })
  @ApiParam({ name: 'type', description: 'Transaction type'})
  @ApiParam({ name: 'from', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiParam({ name: 'to', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: ['invalid from date given', 'invalid to date given', 'invalid type given',
      'invalid period range given'].join('<br>'),
  })
  @ApiResponse({ status: 500, description: `failed to get transaction stats '[reason]'` })
  async getTransactionStats(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const fromParam = req.params.from;
    const toParam = req.params.to;

    let from = 0;
    let to = 0;

    from = Math.floor(new Date(fromParam.match(/\D/) ? fromParam : Number(fromParam)).getTime() / 86400000);
    to = Math.floor(new Date(toParam.match(/\D/) ? toParam : Number(toParam)).getTime() / 86400000);

    if (Number.isNaN(from)) {
      return res.status(400).send('invalid from date given');
    }

    if (Number.isNaN(to)) {
      return res.status(400).send('invalid to date given');
    }

    const type = req.params.type;

    if (!this.transactions.hasIdentifier(type)) {
      return res.status(400).send('invalid type given');
    }

    if (to <= from || to - from > 100) {
      return res.status(400).send('invalid period range given');
    }

    const stats = await this.transactions.getStats(type, from, to);

    res.status(200).json(stats);
  }
}
