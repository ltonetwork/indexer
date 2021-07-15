import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { ActivationStatus, NodeService } from '../node/node.service';
import { RequestService } from '../request/request.service';

export interface BridgeStats {
  burn_rate: number;
  burned: number;
  volume: {
    lto: {
      address: string;
      total: number;
      supply: number;
      burned: number;
      remaining: number;
      burn_fee: number;
    },
    lto20: {
      address: string;
      total: number;
      supply: number;
      bridge: number;
      initial: number;
      burned: number;
      burn_fee: number;
    },
    binance: {
      address: string;
      total: number;
      bridge: number;
      supply: number;
      burn_fee: number;
    }
  }
}

@Injectable()
export class SupplyService {
  private bridgeUrl: string = 'https://bridge.lto.network'

  constructor(
    private readonly node: NodeService,
    private readonly storage: StorageService,
    private readonly request: RequestService,
  ) { }

  // @todo: get information from bridge
  //        https://bridge.lto.network
  //        this contains the total supply, burn wallets, ERC20
  //        tx fee burn will be an index calculated here

  // What is supply:
  //        total supply
  //        minus balance of burn wallets
  //        minus amount burned in ERC20 (or LTO20)
  //        minus TX fee burn
  //        minus locked from spreadsheet

  // @todo: get fee burn
  //        count number of txs since block where feature activated * 0.1 LTO (tx fee burn)
  //        the fee burn for each tx changes to a percentage with the new feature vote of v1.4

  // @todo: get information from locked spreadsheet
  //        https://docs.google.com/spreadsheets/d/1SaPvNOHk8SPMEUP9L-1OOBpGw8b6xKxQkmJE9f5zsA8/edit#gid=604296154
  //        the locked spreadsheet column Q has the new locked value
  //        retrieve the locked for current month (July 2021 = Q43 for example)
  //          - the amount should equal [ Q96 (total) - Q43 (locked) ] for July 2021
  async getCirculatingSupply(): Promise<string> {
    const txFeeBurn = await this.getTxFeeBurned();
    const bridgeStats = await this.request.get<BridgeStats>(`${this.bridgeUrl}/stats`);
    if (bridgeStats instanceof Error) {
      return Promise.reject(bridgeStats);
    }

    const result = this.calculateResult(bridgeStats.data, txFeeBurn);
    return this.fixedDecimals(result);
  }

  private calculateResult(bridgeStats: BridgeStats, txFeeBurn: number): number {
    // @todo: minus locked from spreadsheet
    return (
      bridgeStats.volume.lto.supply
      + bridgeStats.volume.lto20.supply
      - bridgeStats.volume.lto.burned
      - bridgeStats.volume.lto20.burned
      - txFeeBurn
    );
  }

  private fixedDecimals(input: number): string {
    return (Math.round(input * 100) / 100).toFixed(8);
  }

  async incrTxFeeBurned(blockHeight: number): Promise<void> {
    const isFeatureActivated = await this.isFeatureActivated(blockHeight);
    if (!isFeatureActivated) {
      return;
    }

    const current = await this.storage.getTxFeeBurned().catch<number>(() => 0);

    const burnFee = 0.1;
    const newValue = current + (1 * burnFee);

    return this.storage.setTxFeeBurned(newValue.toString());
  }

  async getTxFeeBurned(): Promise<number> {
    return this.storage.getTxFeeBurned();
  }

  async getFeeBurnFeatureHeight(): Promise<number | Error> {
    return this.storage.getFeeBurnFeatureHeight();
  }

  async isFeatureActivated(blockHeight: number): Promise<boolean> {
    const activationHeight = await this.getFeeBurnFeatureHeight().catch<number | Error>(() => null);

    if (!activationHeight) {
      const activationStatus = await this.node.getActivationStatus().catch<ActivationStatus>(() => null);
      if (!activationStatus) {
        return false;
      }
  
      const feeBurnFeature = activationStatus.features.find(each => each.id === 12);
      if (!feeBurnFeature || !feeBurnFeature.activationHeight) {
        return false;
      }

      await this.storage.setFeeBurnFeatureHeight(feeBurnFeature.activationHeight.toString());
  
      if (blockHeight < feeBurnFeature.activationHeight) {
        return false;
      }
    }

    if (blockHeight < activationHeight) {
      return false;
    }

    return true;
  }
}
