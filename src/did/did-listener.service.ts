import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { IndexDocumentType } from '../index/model/index.model';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { base58decode, buildAddress, chainIdOf } from '@lto-network/lto-crypto';
import { StorageService } from '../storage/storage.service';
import { VerificationMethodService } from './verification-method/verification-method.service';

@Injectable()
export class DidListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly storage: StorageService,
    private readonly verificationMethodService: VerificationMethodService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  async onModuleInit() {
    if (!this.config.isDIDIndexingEnabled()) {
      this.logger.debug(`transaction-listener: Not processing identities`);
      return;
    }

    this.indexEmitter.on(
      IndexEvent.IndexTransaction,
      (val: IndexEventsReturnType['IndexTransaction']) => this.index(val),
    );
  }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { sender, senderPublicKey, senderKeyType, associationType, timestamp } = transaction;

    this.logger.debug(`DID: saving ${senderKeyType} public key ${senderPublicKey} for address ${sender}`);
    await this.storage.savePublicKey(sender, senderPublicKey, senderKeyType, timestamp);

    if (transaction.type === 20) {
      await this.indexRegister(transaction);
    } else if (transaction.type === 16 && associationType >= 0x0100 && associationType <= 0x0120) {
      await this.indexIssue(transaction);
    } else if (transaction.type === 17 && associationType >= 0x0100 && associationType <= 0x0120) {
      await this.indexRevoke(transaction);
    } else if (transaction.type === 12) {
      await this.indexServices(transaction);
    }
  }

  private async indexRegister(tx: Transaction): Promise<void> {
    await Promise.all(tx.accounts.map( account => {
      const address = buildAddress(base58decode(account.publicKey), chainIdOf(tx.sender));
      this.logger.debug(`DID: register ${account.keyType} public key ${account.publicKey} for address ${address}`);
      return this.storage.savePublicKey(address, account.publicKey, account.keyType, tx.timestamp);
    }));
  }

  private async indexIssue(tx: Transaction): Promise<void> {
    const data = Object.fromEntries((tx.data ?? []).map(({ key, value }) => [key, !!value]));
    await this.verificationMethodService.save(tx.associationType, tx.sender, tx.recipient, data, tx.timestamp);
  }

  private async indexRevoke(tx: Transaction): Promise<void> {
    await this.verificationMethodService.revoke(tx.sender, tx.recipient, tx.timestamp);
  }

  private async indexServices(tx: Transaction): Promise<void> {
    const services: Record<string, any> = tx.data!
      .filter(({ key }) => key.startsWith('did:service:'))
      .map(({ key, value }) => ({
        id: `did:lto:${tx.sender}#` + key.replace(/^did:service:/, ''),
        ...(typeof value === 'string' ? JSON.parse(value) : {}),
        timestamp: tx.timestamp,
      }));

    await Promise.all(services.map(async (service) => {
      this.logger.debug(`DID: 'did:lto:${tx.sender}' add service '${service.id.replace(/^did:lto:\w+#/, '')}'`);
      await this.storage.saveService(tx.sender, service);
    }));
  }
}
