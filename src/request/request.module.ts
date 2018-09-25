import { Module, HttpModule } from '@nestjs/common';
import { requestProviders } from './request.providers';
import { RequestService } from './request.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';

export const RequestModuleConfig = {
  imports: [LoggerModule, ConfigModule, HttpModule],
  controllers: [],
  providers: [
    ...requestProviders,
    RequestService,
  ],
  exports: [
    ...requestProviders,
    RequestService,
  ],
};

@Module(RequestModuleConfig)
export class RequestModule { }
