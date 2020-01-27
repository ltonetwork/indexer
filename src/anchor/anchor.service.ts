import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import delay from 'delay';
import { IndexDocumentType } from '../index/model/index.model';
import { EncoderService } from '../encoder/encoder.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AnchorService {
  public transactionTypes: Array<number>;
  public anchorToken: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly encoder: EncoderService,
    private readonly storage: StorageService,
  ) {
    this.transactionTypes = [12, 15];
    this.anchorToken = '\u2693';
  }

  async index(index: IndexDocumentType) {
    const { transaction, blockHeight, position } = index;

    if (this.transactionTypes.indexOf(transaction.type) === -1) {
      return;
    }

    // @todo: move this to anchor-indexer service
    // Process old data transactions
    if (transaction.type === 12 && !!transaction.data) {
      for (const item of transaction.data) {
        if (item.key === this.anchorToken) {
          const value = item.value.replace('base64:', '');
          const hexHash = this.encoder.hexEncode(
            this.encoder.base64Decode(value),
          );
          this.logger.info(
            `anchor: save hash ${hexHash} with transaction ${transaction.id}`,
          );
          await this.storage.saveAnchor(hexHash, {
            id: transaction.id,
            blockHeight,
            position,
          });
        }
      }
    } else if (transaction.type === 15 && !!transaction.anchors) {
      transaction.anchors.forEach(async anchor => {
        const hexHash = this.encoder.hexEncode(
          this.encoder.base58Decode(anchor),
        );
        this.logger.info(
          `anchor: save hash ${hexHash} with transaction ${transaction.id}`,
        );
        await this.storage.saveAnchor(hexHash, {
          id: transaction.id,
          blockHeight,
          position,
        });
      });
    }
  }
}
