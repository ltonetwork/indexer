import { StorageInterface } from '../interfaces/storage.interface';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { RedisService } from '../../redis/redis.service';

export class LeveldbStorageService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) { }

  async onModuleInit() { }

  async onModuleDestroy() {}
}
