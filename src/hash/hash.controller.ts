import {Controller, Post, Req, Res, Get, UseGuards} from '@nestjs/common';
import { ApiImplicitParam, ApiImplicitBody, ApiOperation, ApiResponse, ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { HashDto } from './dto/hash.dto';
import { NodeService } from '../node/node.service';
import { EncoderService } from '../encoder/encoder.service';
import { BearerAuthGuard } from '../auth/auth.guard';

@Controller('hash')
@ApiUseTags('hash')
export class HashController {
  constructor(
    private readonly logger: LoggerService,
    private readonly node: NodeService,
    private readonly encoder: EncoderService,
  ) { }

  @Post()
  @UseGuards(BearerAuthGuard)
  @ApiOperation({ title: 'Anchor hash to the blockchain' })
  @ApiImplicitBody({ name: 'hash', type: HashDto })
  @ApiBearerAuth()
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: ['invalid body given', 'no hash given', 'invalid hash given', 'invalid encoding given'].join('<br>'),
  })
  @ApiResponse({ status: 500, description: `failed to anchor '[reason]'` })
  async add(@Req() req: Request, @Res() res: Response): Promise<Response> {
    if (!req.body) {
      return res.status(400).send('invalid body given');
    }

    const hash = req.body.hash;
    if (!hash) {
      return res.status(400).send('no hash given');
    }

    const encoding = req.body.encoding || 'hex';
    if (['base64', 'base58', 'hex'].indexOf(encoding) === -1) {
      return res.status(400).send('invalid encoding given');
    }

    if (!this.encoder.validateHash(hash, encoding)) {
      return res.status(400).send('invalid hash given');
    }

    try {
      const chainpoint = await this.node.anchor(hash, encoding);
      res.status(200).json({ chainpoint });
    } catch (e) {
      this.logger.error(`hash-controller: failed to anchor '${e}'`, { stack: e.stack });

      if (e.response) {
        return res.status(500).send(`failed to anchor '${JSON.stringify(e.response.data, null, 1)}'`);
      } else {
        return res.status(500).send(`failed to anchor '${e}'`);
      }
    }
  }

  @Get(':hash')
  @ApiOperation({ title: 'Verify if hash is anchored' })
  @ApiImplicitParam({ name: 'hash' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'no hash given' })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 500, description: `failed to get transaction by hash '[reason]'` })
  async getTransactionByHash(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const hash = req.params.hash;
    if (!hash) {
      return res.status(400).send('no hash given');
    }

    try {
      const chainpoint = await this.node.getTransactionByHash(hash);

      if (!chainpoint) {
        return res.status(404).send({ chainpoint: null });
      }

      res.status(200).json({ chainpoint });
    } catch (e) {
      this.logger.error(`hash-controller: failed to get transaction by hash '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get transaction by hash '${e}'`);
    }
  }

  @Get(':hash/encoding/:encoding')
  @ApiOperation({ title: 'Verify if hash is anchored with given encoding' })
  @ApiImplicitParam({ name: 'hash' })
  @ApiImplicitParam({ name: 'encoding' })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: ['no hash given', 'invalid encoding given'].join('<br>'),
  })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 500, description: `failed to get transaction by hash and encoding '[reason]'` })
  async getTransactionByHashAndEncoding(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const hash = req.params.hash;
    if (!hash) {
      return res.status(400).send('no hash given');
    }

    const encoding = req.params.encoding;
    if (['base64', 'base58', 'hex'].indexOf(encoding) === -1) {
      return res.status(400).send('invalid encoding given');
    }

    try {
      const chainpoint = await this.node.getTransactionByHash(hash, encoding);

      if (!chainpoint) {
        return res.status(404).send({ chainpoint: null });
      }

      res.status(200).json({ chainpoint });
    } catch (e) {
      this.logger.error(`hash-controller: failed to get transaction by hash and encoding '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get transaction by hash and encoding '${e}'`);
    }
  }
}
