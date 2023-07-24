import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfigService } from '../common/config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { EmitterService } from '../emitter/emitter.service';
import { IndexEvent, IndexEventsReturnType } from '../index/index.events';
import { IndexDocumentType } from '../index/model/index.model';
import { StorageService } from '../storage/storage.service';
import { TrustNetworkService } from '../trust-network/trust-network.service';

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
    const { transaction: tx } = index;

    if (
      tx.type !== 23 ||
      !(tx.statementType >= 0x10 && tx.statementType <= 0x15) ||
      !tx.subject ||
      !(await this.shouldIndex(tx.sender, tx.statementType < 0x14 ? this.statusIndexing : this.disputesIndexing))
    ) {
      return;
    }

    this.logger.debug(`credential-status-listener: Saving credential status ${tx.type} for ${tx.subject}`);

    const data: Record<string, any> = Object.fromEntries((tx.data || []).map((entry) => [entry.key, entry.value]));

    await this.storage.saveCredentialStatus(tx.subject, {
      ...data,
      type: tx.statementType,
      sender: tx.sender,
      timestamp: tx.timestamp,
    });
  }
}
