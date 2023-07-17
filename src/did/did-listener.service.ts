import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { IndexDocumentType } from '../index/model/index.model';
import { Transaction } from '../transaction/interfaces/transaction.interface';
import { StorageService } from '../storage/storage.service';
import { VerificationMethodService } from './verification-method/verification-method.service';
import { buildAddress, networkId } from '../utils/crypto';

@Injectable()
export class DIDListenerService implements OnModuleInit {
  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly storage: StorageService,
    private readonly verificationMethodService: VerificationMethodService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    if (!this.config.isDIDIndexingEnabled()) {
      this.logger.debug(`transaction-listener: Not processing identities`);
      return;
    }

    this.indexEmitter.on(IndexEvent.IndexTransaction, (val: IndexEventsReturnType['IndexTransaction']) =>
      this.index(val),
    );
  }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    const { sender, senderPublicKey, senderKeyType, associationType, statementType, timestamp } = transaction;

    this.logger.debug(`DID: saving ${senderKeyType} public key ${senderPublicKey} for address ${sender}`);
    await this.storage.savePublicKey(sender, senderPublicKey, senderKeyType, timestamp);

    if (transaction.type === 20) {
      await this.indexRegister(transaction);
    } else if (transaction.type === 16 && associationType >= 0x100 && associationType <= 0x120) {
      await this.indexIssue(transaction);
    } else if (transaction.type === 17 && associationType >= 0x100 && associationType <= 0x120) {
      await this.indexRevoke(transaction);
    } else if (transaction.type === 23 && (statementType === 0x120 || statementType === 0x121)) {
      await this.indexDeactivation(transaction);
    } else if (transaction.type === 12) {
      await this.indexServices(transaction);
    }
  }

  private async indexRegister(tx: Transaction): Promise<void> {
    await Promise.all(
      tx.accounts.map((account) => {
        const address = buildAddress(account.publicKey, networkId(tx.sender));
        this.logger.debug(`DID: register ${account.keyType} public key ${account.publicKey} for address ${address}`);
        return this.storage.savePublicKey(address, account.publicKey, account.keyType, tx.timestamp);
      }),
    );
  }

  private async indexIssue(tx: Transaction): Promise<void> {
    if (tx.associationType !== 0x100) {
      const type = '0x' + tx.associationType.toString(16);
      this.logger.info(`DID: Deprecation warning, tx ${tx.id} used type ${type} for verification method`);
    }

    const data = Object.fromEntries((tx.data ?? []).map(({ key, value }) => [key, !!value]));
    await this.verificationMethodService.save(
      tx.associationType,
      tx.sender,
      tx.recipient,
      data,
      tx.timestamp,
      tx.expires,
    );
  }

  private async indexRevoke(tx: Transaction): Promise<void> {
    await this.verificationMethodService.revoke(tx.associationType, tx.sender, tx.recipient, tx.timestamp);
  }

  private async indexDeactivation(tx: Transaction): Promise<void> {
    const address = tx.statementType === 0x120 ? tx.sender : tx.recipient;
    if (!address) return;

    if (!(await this.verificationMethodService.hasDeactivateCapability(address, tx.sender))) {
      this.logger.info(`DID: 'did:lto:${address}' cannot be deactivated by ${tx.sender}`);
      return;
    }

    this.logger.debug(`DID: 'did:lto:${address}' deactivated by ${tx.sender}`);
    await this.storage.deactivateDID(address, tx.sender, tx.timestamp);
  }

  private async indexServices(tx: Transaction): Promise<void> {
    const services: Record<string, any> = (tx.data ?? [])
      .filter(({ key }) => key.startsWith('did:service:'))
      .map(({ key, value }) => ({
        id: `did:lto:${tx.sender}#` + key.replace(/^did:service:/, ''),
        ...(typeof value === 'string' ? JSON.parse(value) : {}),
        timestamp: tx.timestamp,
      }));

    if (services.length === 0) return;

    await Promise.all(
      services.map(async (service) => {
        this.logger.debug(`DID: 'did:lto:${tx.sender}' add service '${service.id.replace(/^did:lto:\w+#/, '')}'`);
        await this.storage.saveDIDService(tx.sender, service);
      }),
    );
  }
}
