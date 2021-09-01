import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { IndexDocumentType } from '../../index/model/index.model';
import { StorageService } from '../../storage/storage.service';
import { VerificationMethod } from './model/verification-method.model';

@Injectable()
export class VerificationMethodService {

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) {
  }
  
  async getMethodsFor(address: string): Promise<VerificationMethod[]> {
    return this.storage.getVerificationMethods(address);
  }

  async save(type: number, sender: string, recipient: string) {
    const verificationMethod = new VerificationMethod(type, sender, recipient, Math.floor((+new Date()) / 1000));

    this.logger.debug(`identity: address ${sender} has verification method ${verificationMethod.asString()}`);
    return this.storage.saveVerificationMethod(sender, verificationMethod);
  }

  async revoke(verificationMethod: VerificationMethod): Promise<void> {
    verificationMethod.revokedAt = Math.floor((+new Date()) / 1000);

    return this.storage.saveVerificationMethod(verificationMethod.sender, verificationMethod);
  }
}
