import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { NodeService } from '../node/node.service';

@Injectable()
export class SupplyService {
  // @todo: What is supply:
  //        total supply (fixed amount?)
  //        minus balance of burn wallets
  //        minus amount burned in ERC20
  //        minus TX fee burn

  // @todo: For balance of burn wallets
  //        need to figure out what are the burn wallets
  //        need to get balance from those wallets

  // @todo: ERC20 is a fixed amount (?)
  //        ERC20 is the Ethereum token

  // @todo: For fee burn:
  //        count number of txs since block where feature activated * 0.1 LTO (tx fee burn)
  //        the fee burn for each tx changes to a percentage with the new feature vote of v1.4

  constructor(
    private readonly node: NodeService,
    private readonly storage: StorageService,
  ) { }

  async getCirculatingSupply(): Promise<number> {
    // @todo: test if all this works...
    const activationStatus = await this.node.getActivationStatus();
    
    console.log('activationStatus: ', activationStatus);
    
    const feeBurnFeature = activationStatus.features.find(each => each.id === 12);
    if (!feeBurnFeature) {
      return Promise.reject('node: fee burn feature was not found')
    }

    const featureBlock = await this.node.getBlock(feeBurnFeature.activationHeight);
    console.log('featureBlock: ', featureBlock);

    // @todo: check if this is useful
    const txStats = await this.storage.getTxStats('all', featureBlock.timestamp, Date.now());
    console.log('txStats: ', txStats);

    return Promise.resolve(12345678.12345678);
  }
}
