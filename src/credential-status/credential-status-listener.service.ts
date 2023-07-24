import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';
import { CredentialStatus } from './credential-status.model';

@Injectable()
export class CredentialStatusListenerService implements OnModuleInit {
  readonly statusIndexing: 'none' | 'trust' | 'all';
  readonly disputesIndexing: 'none' | 'trust' | 'all';

  constructor(
    private readonly indexEmitter: EmitterService<IndexEventsReturnType>,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
    private readonly trust: TrustNetworkService,
  ) {
    this.statusIndexing = this.config.getCredentialStatusIndexing();
    this.disputesIndexing = this.config.getCredentialDisputesIndexing();
  }

  async onModuleInit() {
    if (this.statusIndexing === 'none' && this.disputesIndexing === 'none') {
      this.logger.debug(`credential-status-listener: Not processing credential status list`);
      return;
    }

    this.indexEmitter.on(IndexEvent.IndexTransaction, (val: IndexEventsReturnType['IndexTransaction']) =>
      this.index(val),
    );
  }

  private async shouldIndex(sender: string, enabled: 'none' | 'trust' | 'all'): Promise<boolean> {
    if (enabled === 'none') return false;

    if (enabled === 'trust') {
      return await this.trust.hasRole(sender);
    }

    return true;
  }

  async index(index: IndexDocumentType): Promise<void> {
    const { transaction } = index;
    if (transaction.type !== 23) return;

    const { statementType, subject, sender, timestamp } = transaction;

    if (statementType >= 0x10 && statementType <= 0x13) {
      await this.indexStatus(statementType, subject, sender, timestamp);
    } else if (statementType === 0x14 || statementType === 0x15) {
      await this.indexDispute(statementType, subject, sender, timestamp);
    }
  }

  async indexStatus(type: number, subject: string, sender: string, timestamp: number): Promise<void> {
    if (!subject || !(await this.shouldIndex(sender, this.statusIndexing))) return;

    this.logger.debug(`credential-status-listener: Saving credential status ${type} for ${subject}`);
    await this.storage.saveCredentialStatus(subject, new CredentialStatus(type, sender, timestamp));
  }

  // Index dispute or acknowledgement
  async indexDispute(type: number, subject: string, sender: string, timestamp: number): Promise<void> {
    if (!subject || !(await this.shouldIndex(sender, this.disputesIndexing))) return;

    this.logger.debug(`credential-status-listener: Saving credential dispute ${type} for ${subject}`);
    await this.storage.saveCredentialStatus(subject, new CredentialStatus(type, sender, timestamp));
  }
}
