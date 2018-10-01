import { Transaction } from './transaction.interface';

export interface Block {
  height;
  transactions: Array<Transaction>;
}