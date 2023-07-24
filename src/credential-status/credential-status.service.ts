import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../common/config/config.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CredentialStatusService {
  constructor(readonly logger: LoggerService, readonly config: ConfigService, readonly storage: StorageService) {}
}
