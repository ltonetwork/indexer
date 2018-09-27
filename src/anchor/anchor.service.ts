import { Injectable } from '@nestjs/common';
import { AnchorMonitorService } from './anchor-monitor.service';
import { LoggerService } from '../logger/logger.service';
import delay from 'delay';

@Injectable()
export class AnchorService {
  public started: boolean;

  constructor(
    private readonly logger: LoggerService,
    private readonly monitor: AnchorMonitorService,
  ) { }

  async start() {
    this.logger.info(`anchor: starting monitor`);

    if (this.started) {
      return this.logger.warn('anchor: monitor already running');
    }

    try {
      this.started = true;
      await this.monitor.start();
    } catch (e) {
      this.logger.error(`anchor: failed to start monitor: ${e}`);
      this.started = false;
      await delay(2000);
      return this.start();
    }
  }
}
