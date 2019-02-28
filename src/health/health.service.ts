import { Injectable } from '@nestjs/common';
import { ConfigService } from './../config/config.service';
import { LoggerService } from './../logger/logger.service';
import { AnchorMonitorService } from '../anchor/anchor-monitor.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
    private readonly monitor: AnchorMonitorService,
  ) {
  }

  async isNodeHealthy(): Promise<boolean> {
    return this.monitor.isSynced();
  }
}
