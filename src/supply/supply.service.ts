import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { NodeService } from '../node/node.service';

@Injectable()
export class SupplyService {
  // @todo: get information from bridge
  //        https://bridge.lto.network
  //        this contains the total supply, burn wallets, ERC20
  //        tx fee burn will be an index calculated here

  // @todo: What is supply:
  //        total supply
  //        minus balance of burn wallets
  //        minus amount burned in ERC20 (or LTO20)
  //        minus TX fee burn
  //        minus locked from spreadsheet

  // @todo: For fee burn:
  //        count number of txs since block where feature activated * 0.1 LTO (tx fee burn)
  //        the fee burn for each tx changes to a percentage with the new feature vote of v1.4

  // @todo: For locked:
  //        https://docs.google.com/spreadsheets/d/1SaPvNOHk8SPMEUP9L-1OOBpGw8b6xKxQkmJE9f5zsA8/edit#gid=604296154
  //        the locked spreadsheet column Q has the new locked value
  //        retrieve the locked for current month (July 2021 = Q43 for example)
  //          - the amount should equal [ Q96 (total) - Q43 (locked) ] for July 2021

  constructor(
    private readonly node: NodeService,
    private readonly storage: StorageService,
  ) { }

  async getCirculatingSupply(): Promise<number> {
    const txFeeBurn = await this.getTxFeeBurned();
    // @todo: get the rest of the info

    return Promise.resolve(txFeeBurn);
  }

  async incrTxFeeBurned(blockHeight: number): Promise<void> {
    const activationStatus = await this.node.getActivationStatus().catch(() => null);
    if (!activationStatus) {
      return;
    }

    const feeBurnFeature = activationStatus.features.find(each => each.id === 12);
    if (!feeBurnFeature) {
      return;
    }

    if (blockHeight < feeBurnFeature.activationHeight) {
      return;
    }

    const value = await this.storage.getTxFeeBurned().catch(() => '0');

    if (value === '0') {
      return;
    }

    const burnFee = 0.1;
    const current = Number(value);
    const newValue = current + (1 * burnFee);

    return this.storage.setTxFeeBurned(newValue.toString());
  }

  async getTxFeeBurned(): Promise<number> {
    return this.storage.getTxFeeBurned();
  }
}
