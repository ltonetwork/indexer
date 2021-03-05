import { Controller, Post, Req, Res, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags, ApiImplicitQuery, ApiImplicitParam } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { TransactionService } from './transaction.service';
import { LoggerService } from '../logger/logger.service';
import { NodeService } from '../node/node.service';
export type txType = 'transfer' | 'anchor';

@Controller('transactions')
@ApiUseTags('transaction')
export class TransactionController {
  constructor(
    private readonly logger: LoggerService,
    private readonly node: NodeService,
    private readonly tx: TransactionService,
  ) { }

  @Get('addresses/:address')
  @ApiOperation({ title: 'Get transactions by address' })
  @ApiImplicitParam({ name: 'address', description: 'Filter by address' })
  @ApiImplicitQuery({ name: 'limit', required: false, description: 'Limit amount of transactions returned' })
  @ApiImplicitQuery({ name: 'offset', required: false, description: 'Start search at given offset' })
  @ApiImplicitQuery({
    name: 'type',
    required: false,
    description: 'Filter by type',
    enum: ['all_transfers', 'anchor', 'transfer', 'mass_transfer', 'start_lease', 'cancel_lease'],
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

    const type = (req.query.type || 'transfer') as txType;
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
}
