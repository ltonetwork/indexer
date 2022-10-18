import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { EncoderService } from '../encoder/encoder.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../config/config.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';

@Injectable()
export class MappedAnchorService {
  constructor(
    private readonly logger: LoggerService,
    private readonly encoder: EncoderService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly trust: TrustNetworkService,
  ) { }

  async index(index: IndexDocumentType, anchorIndexing: 'trust' | 'all') {
    const { transaction, blockHeight, position } = index;
    const { sender } = transaction;

    if (transaction.type !== 22) {
      return;
    }

    if (anchorIndexing === 'trust') {
      const senderRoles = await this.trust.getRolesFor(sender);
      const isSenderTrustNetwork = Object.keys(senderRoles.roles).length > 0;

      if (!isSenderTrustNetwork) {
        return;
      }
    }

    for (const [key, value] of Object.entries(transaction.anchors as {[_: string]: string})) {
      const hexKey = this.encoder.hexEncode(this.encoder.base58Decode(key));
      const hexValue = this.encoder.hexEncode(this.encoder.base58Decode(value));

      this.logger.debug(`mapped-anchor: save ${hexKey}:${hexValue} with transaction ${transaction.id}`);

      await this.storage.saveMappedAnchor(hexKey, {
        anchor: hexValue,
        id: transaction.id,
        blockHeight,
        position,
      });
    }
  }
}
