import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { Transaction } from '../interfaces/transaction.interface';
import { buildAddress, networkId } from '../utils/crypto';

@Injectable()
export class PublickeyListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    if (!this.config.isDIDIndexingEnabled() && this.config.getCredentialDisputesIndexing() !== 'none') {
      this.logger.debug(`publickey-listener: Not processing public keys`);
      return;
    }

    this.indexEmitter.on(IndexEvent.IndexTransaction, (val: IndexEventsReturnType['IndexTransaction']) =>
      this.index(val),
    );
  }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { sender, senderPublicKey, senderKeyType, timestamp } = transaction;

    this.logger.debug(`Public key: saving ${senderKeyType} public key ${senderPublicKey} for address ${sender}`);
    await this.storage.savePublicKey(sender, senderPublicKey, senderKeyType, timestamp);

    if (transaction.type === 20) {
      await this.indexRegister(transaction);
    }
  }

  private async indexRegister(tx: Transaction): Promise<void> {
    await Promise.all(
      tx.accounts.map((account) => {
        const address = buildAddress(account.publicKey, networkId(tx.sender));
        this.logger.debug(
          `Public key: register ${account.keyType} public key ${account.publicKey} for address ${address}`,
        );
        return this.storage.savePublicKey(address, account.publicKey, account.keyType, tx.timestamp);
      }),
    );
  }
}
