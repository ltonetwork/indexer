import { Controller, Req, Res, Get } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Response, Request } from 'express';

import { StatsService } from './stats.service';
import { SupplyService } from './supply/supply.service';
import { TransactionService } from '../transaction/transaction.service';

@Controller('stats')
@ApiTags('stats')
export class StatsController {
  constructor(
    private readonly service: StatsService,
    private readonly supply: SupplyService,
    private readonly transactions: TransactionService,
  ) {}

  private periodFromReq(req: Request) {
    const fromParam = req.params.from;
    const toParam = req.params.to;

    const from = Math.floor(new Date(fromParam.match(/\D/) ? fromParam : Number(fromParam)).getTime() / 86400000);
    const to = Math.floor(new Date(toParam.match(/\D/) ? toParam : Number(toParam)).getTime() / 86400000);

    if (Number.isNaN(from)) {
      throw Error('invalid from date given');
    }

    if (Number.isNaN(to)) {
      throw Error('invalid to date given');
    }

    if (to <= from || to - from > 100) {
      throw Error('invalid period range given');
    }

    return { from, to };
  }

  @Get('/operations/:from/:to')
  @ApiParam({ name: 'from', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiParam({ name: 'to', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiOperation({ summary: 'Get the operation count per day' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'invalid period range given' })
  async getOperationStats(@Req() req: Request, @Res() res: Response): Promise<Response> {
    try {
      const { from, to } = this.periodFromReq(req);
      const stats = await this.service.getOperationStats(from, to);

      res.status(200).json(stats);
    } catch (e) {
      return res.status(400).send({ error: e.message });
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
  @ApiParam({ name: 'type', description: 'Transaction type' })
  @ApiParam({ name: 'from', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiParam({ name: 'to', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: [
      'invalid from date given',
      'invalid to date given',
      'invalid type given',
      'invalid period range given',
    ].join('<br>'),
  })
  @ApiResponse({ status: 500, description: `failed to get transaction stats '[reason]'` })
  async getTransactionStats(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const type = req.params.type;

    if (!this.transactions.hasIdentifier(type)) {
      return res.status(400).send('invalid type given');
    }

    try {
      const { from, to } = this.periodFromReq(req);
      const stats = await this.transactions.getStats(type, from, to);

      res.status(200).json(stats);
    } catch (e) {
      return res.status(400).send(e);
    }
  }

  @Get('/lease/:from/:to')
  @ApiOperation({ summary: 'Get lease increase / decrease per day' })
  @ApiParam({ name: 'from', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiParam({ name: 'to', description: 'Date as `year-month-day` or timestamp in ms' })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: ['invalid from date given', 'invalid to date given', 'invalid period range given'].join('<br>'),
  })
  @ApiResponse({ status: 500, description: `failed to get transaction stats '[reason]'` })
  async getLeaseStats(@Req() req: Request, @Res() res: Response): Promise<Response> {
    try {
      const { from, to } = this.periodFromReq(req);
      const stats = await this.service.getLeaseStats(from, to);

      res.status(200).json(stats);
    } catch (e) {
      return res.status(400).send(e);
    }
  }
}
