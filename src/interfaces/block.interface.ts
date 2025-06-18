import { Transaction } from './transaction.interface';

export interface Block {
  height;
  timestamp: number;
  transactions: Array<Transaction>;
  transactionCount: number;
  generator: string;
  generatorReward: number;
  burnedFees: number;
}

export interface BlockHeader {
  height;
  timestamp: number;
  transactionCount: number;
  generator: string;
  generatorReward: number;
  burnedFees: number;
}
