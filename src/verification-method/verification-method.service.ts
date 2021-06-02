import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class VerificationMethodService {
  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) {
  }

  async index(index: IndexDocumentType) {
    const { transaction } = index;
    const { sender, associationType } = transaction;

    const verificationMethod = this.getVerificationFromAssociation(sender, associationType);
    
    this.logger.debug(`verificationMethod: address ${sender} has verification method ${verificationMethod}`);
    await this.storage.saveVerificationMethod(sender, verificationMethod);
  }

  private getVerificationFromAssociation(sender: string, associationType: number) {
    // @todo: use proper types
    let verification: any = {};
    const verificationValue = `did:lto:${sender}#key`;

    // @todo: make the calculations as they should be (bitwise operations)
    // example
    if (associationType === 0x010007) {
      verification.authentication = verificationValue;
      verification.assertionMethod = verificationValue;
      verification.keyAgreement = verificationValue;
    }

    return verification;
  }
}
