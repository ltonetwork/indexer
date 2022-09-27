import { Transaction } from './transaction.interface';

export interface Block {
  height;
  timestamp: number;
  transactionCount: number;
  generator: string;
  transactions: Array<Transaction>;
  burnedFees: number;
}
