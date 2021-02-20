import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import delay from 'delay';
import { IndexDocumentType } from '../index/model/index.model';
import { EncoderService } from '../encoder/encoder.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PublicKeyService {
  constructor(
    private readonly logger: LoggerService,
    private readonly encoder: EncoderService,
    private readonly storage: StorageService,
  ) {
  }

  async index(index: IndexDocumentType) {
    const { transaction, blockHeight, position } = index;
    const { sender, senderPublicKey } = transaction;

    this.logger.info(
      `publicKey: address ${sender} has public key ${senderPublicKey}`,
    );
    await this.storage.savePublicKey(sender, senderPublicKey);
  }
}
