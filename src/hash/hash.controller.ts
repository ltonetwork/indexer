import { Controller, Post, Req, Res, Get } from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { HashService } from './hash.service';

@Controller('hash')
export class HashController {
  constructor(
    private readonly logger: LoggerService,
    private readonly hash: HashService,
  ) { }

  @Post()
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

    if (!this.hash.encoder.validateSHA256(hash, encoding)) {
      return res.status(400).send('invalid hash given');
    }

    try {
      const chainpoint = await this.hash.anchor(hash, encoding);
      res.json({ chainpoint });
    } catch (e) {
      this.logger.error(`hash-controller: failed to anchor '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to anchor '${e}'`);
    }
  }

  @Get(':hash')
  async getTransactionByHash(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const hash = req.params.hash;
    if (!hash) {
      return res.status(400).send('no hash given');
    }

    try {
      const chainpoint = await this.hash.getTransactionByHash(hash);

      if (!chainpoint) {
        return res.status(404).send({ chainpoint: null });
      }

      res.json({ chainpoint });
    } catch (e) {
      this.logger.error(`hash-controller: failed to get transaction by hash '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get transaction by hash '${e}'`);
    }
  }

  @Get(':hash/encoding/:encoding')
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
      const hexHash = this.hash.encoder.hexEncode(this.hash.encoder.decode(hash, encoding));
      const chainpoint = await this.hash.getTransactionByHash(hexHash);

      if (!chainpoint) {
        return res.status(404).send({ chainpoint: null });
      }

      res.json({ chainpoint });
    } catch (e) {
      this.logger.error(`hash-controller: failed to get transaction by hash and encoding '${e}'`, { stack: e.stack });
      return res.status(500).send(`failed to get transaction by hash and encoding '${e}'`);
    }
  }
}
