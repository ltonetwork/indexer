import { Controller, Post, Req, Res, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { TransactionService } from './transaction.service';
import { LoggerService } from '../logger/logger.service';
import { NodeService } from '../node/node.service';
export type txType = 'transfer' | 'anchor';

@Controller('transactions')
@ApiTags('transaction')
export class TransactionController {
  constructor(
    private readonly logger: LoggerService,
    private readonly node: NodeService,
    private readonly tx: TransactionService,
  ) { }

  @Get('addresses/:address')
  @ApiOperation({ summary: 'Get transactions by address' })
  @ApiParam({ name: 'address', description: 'Filter by address' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit amount of transactions returned' })
  @ApiQuery({ name: 'offset', required: false, description: 'Start search at given offset' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by type',
    enum: [
      'all',
      'anchor',
      'transfer',
      'mass_transfer',
      'all_transfers',
      'start_lease',
      'cancel_lease',
      'lease',
      'association',
      'script',
      'sponsor',
    ],
  })
  @ApiResponse({ status: 200, headers: { 'X-Total': { description: 'Total amount of transactions' } } })
  @ApiResponse({
    status: 400,
    description: ['no address given', 'invalid type given', 'limit may not exceed 100'].join('<br>'),
  })
  @ApiResponse({ status: 500, description: `failed to get transaction by address '[reason]'` })
  async getTransactionsForAddress(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const address = req.params.address;
    if (!address) {
      return res.status(400).send('no address given');
    }

    const type = (req.query.type || 'all') as txType;
    if (!this.tx.hasIdentifier(type)) {
      return res.status(400).send('invalid type given');
    }

    const { limit, offset } = req.query;
    if (Number(limit) > 100) {
      return res.status(400).send('limit may not exceed 100');
    }

    try {
      const transactions = await this.node.getTransactionsByAddress(
        address,
        type,
        limit !== undefined ? Number(limit) : undefined,
        offset !== undefined ? Number(offset) : undefined,
      );
      const count = await this.node.countTransactionsByAddress(address, type);
      const expanded = await this.node.getTransactions(transactions);

      res.setHeader('X-Total', count);
      res.status(200).json(expanded);
    } catch (e) {
      this.logger.error(`transaction-controller: failed to get transaction by address '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get transaction by address '${e}'`);
    }
  }

  @Get('stats/:type/:from/:to')
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

    const type = req.params.type as txType;
    if (!this.tx.hasIdentifier(type)) {
      return res.status(400).send('invalid type given');
    }

    if (to <= from || to - from > 100) {
      return res.status(400).send('invalid period range given');
    }

    const stats = await this.tx.getStats(type, from, to);

    res.status(200).json(stats);
  }
}
