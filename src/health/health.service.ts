import { Injectable } from '@nestjs/common';
import { ConfigService } from './../config/config.service';
import { LoggerService } from './../logger/logger.service';
import { NodeService } from '../node/node.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
    private readonly node: NodeService,
  ) {
  }

  async isNodeHealthy(): Promise<boolean> {
    return this.node.isNodeHealthy();
  }
}
