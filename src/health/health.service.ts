import { Injectable } from '@nestjs/common';
import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { IndexMonitorService } from '../index/index-monitor.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
    private readonly monitor: IndexMonitorService,
  ) {}

  async isNodeHealthy(): Promise<{
    sync: boolean;
    message: string;
    data: any;
  }> {
    return this.monitor.syncStatus();
  }
}
