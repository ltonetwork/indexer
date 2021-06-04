import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { VerificationMethod } from './model/verification-method.model';

@Injectable()
export class VerificationMethodService {

  constructor(
    private readonly logger: LoggerService,
    private readonly storage: StorageService,
  ) {
  }

  async index(index: IndexDocumentType) {
    const { transaction } = index;
    const { id, sender, recipient } = transaction;

    if (!recipient) {
      this.logger.debug(`verificationMethod: transaction ${id} didn't have a recipient address, skipped indexing`);
      return;
    }

    const verificationMethod = new VerificationMethod(transaction.associationType, transaction.sender, transaction.recipient);
    const asString = JSON.stringify(verificationMethod.json());

    this.logger.debug(`verificationMethod: address ${sender} has verification method ${asString}`);
    await this.storage.saveVerificationMethod(sender, asString);
  }

  async getMethodsFor(address: string): Promise<VerificationMethod[]> {
    const verificationMethods = await this.storage.getVerificationMethods(address);

    return verificationMethods.map(each => {
      const asJson = JSON.parse(each);

      return new VerificationMethod(asJson.relationships, asJson.sender, asJson.recipient);
    });
  }
}
