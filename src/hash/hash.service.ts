import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HashEncoder } from './classes/hash.encoder';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class HashService implements OnModuleInit, OnModuleDestroy {
  public encoder: HashEncoder;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
  ) {
    this.encoder = new HashEncoder();
  }

  async onModuleInit() { }

  async onModuleDestroy() { }
}
