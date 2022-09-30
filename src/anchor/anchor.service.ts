import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { IndexDocumentType } from '../index/model/index.model';
import { EncoderService } from '../encoder/encoder.service';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { ConfigService } from '../config/config.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';

@Injectable()
export class AnchorService {
  public transactionTypes: Array<number>;
  public anchorToken: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly encoder: EncoderService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly trust: TrustNetworkService,
  ) {
    this.transactionTypes = [12, 15];
    this.anchorToken = '\u2693';
  }

  async index(index: IndexDocumentType, anchorIndexing: 'trust' | 'all') {
    const { transaction, blockHeight, position } = index;
    const { sender } = transaction;

    if (this.transactionTypes.indexOf(transaction.type) === -1) {
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

  public getAnchorHashes(transaction: Transaction): string[] {
    const hashes: string[] = [];

    // Process old data transactions
    if (transaction.type === 12 && !!transaction.data) {
      for (const item of transaction.data) {
        if (item.key === this.anchorToken) {
          const value = item.value.replace('base64:', '');
          const hexHash = this.encoder.hexEncode(this.encoder.base64Decode(value));

          hashes.push(hexHash);
        }
      }
    } else if (transaction.type === 15 && !!transaction.anchors) {
      transaction.anchors.forEach(anchor => {
        const hexHash = this.encoder.hexEncode(this.encoder.base58Decode(anchor));

        hashes.push(hexHash);
      });
    }

    console.log(hashes);

    return hashes;
  }
}
