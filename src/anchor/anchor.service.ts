import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { EncoderService } from '../common/encoder/encoder.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { ConfigService } from '../common/config/config.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';

@Injectable()
export class AnchorService {
  constructor(
    private readonly logger: LoggerService,
    private readonly encoder: EncoderService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly trust: TrustNetworkService,
  ) {}

  async index(index: IndexDocumentType, anchorIndexing: 'trust' | 'all') {
    const { transaction, blockHeight, position } = index;
    const { sender } = transaction;

    if (transaction.type !== 15 && transaction.type !== 22) {
      return;
    }

    if (anchorIndexing === 'trust') {
      const senderRoles = await this.trust.getRolesFor(sender);
      const isSenderTrustNetwork = Object.keys(senderRoles.roles).length > 0;

      if (!isSenderTrustNetwork) {
        return;
      }
    }

    const hashes = this.getAnchorHashes(transaction);

    for (const hexHash of hashes) {
      this.logger.debug(`anchor: save hash ${hexHash} with transaction ${transaction.id}`);

      await this.storage.saveAnchor(hexHash, {
        id: transaction.id,
        blockHeight,
        position,
      });
    }
  }

  private getAnchorHashes(transaction: Transaction): string[] {
    if (transaction.type === 15) {
      return (transaction.anchors as Array<string>).map((hash) =>
        this.encoder.hexEncode(this.encoder.base58Decode(hash)),
      );
    }

    if (transaction.type === 22) {
      return Object.values(transaction.anchors as { [_: string]: string }).map((hash) =>
        this.encoder.hexEncode(this.encoder.base58Decode(hash)),
      );
    }

    throw new Error('Not an anchor tx');
  }
}
