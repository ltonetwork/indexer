import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { METHODS_MAP } from './const/methods.const';
import { VerificationMethods } from './interfaces/methods.interface';

@Injectable()
export class VerificationMethodService {

  private readonly methodsMap = METHODS_MAP;

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) {
  }

  async index(index: IndexDocumentType) {
    const { transaction } = index;
    const { id, sender, associationType, recipient } = transaction;

    if (!recipient) {
      this.logger.debug(`verificationMethod: transaction ${id} didn't have a recipient address, skipped indexing`);
      return;
    }

    const verificationMethod = this.getVerificationFromAssociation(sender, associationType);
    
    this.logger.debug(`verificationMethod: address ${sender} has verification method ${verificationMethod}`);
    await this.storage.saveVerificationMethod(sender, verificationMethod);
  }

  private getVerificationFromAssociation(sender: string, associationType: number): VerificationMethods {
    let result: VerificationMethods = {};
    const verificationValue = `did:lto:${sender}#key`;

    for (const key in this.methodsMap) {
      if ((associationType | this.methodsMap[key]) == associationType) {
        result[key] = [verificationValue];
      }
    }

    return result;
  }
}
